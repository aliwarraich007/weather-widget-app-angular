import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Forcast } from 'src/app/interfaces/forecast.interface';
import { Cache_ } from 'src/app/interfaces/cache.interface';

@Injectable()
export class WeatherInterceptor implements HttpInterceptor {
  private BUFFER_SIZE: number = 10;
  private cacheExpirationTime: number = 3 * 60 * 60 * 1000;
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> | any {
    const url = req.urlWithParams;
    const cachedData = localStorage.getItem(url);
    if (cachedData) {
      const toJson: Cache_ = JSON.parse(cachedData);
      if (!this.isCacheExpired(toJson)) {
        const cachedResponse = new HttpResponse({
          body: toJson.cache,
          status: 200,
          statusText: 'ok',
          url: req.url,
        });

        return of(cachedResponse);
      } else {
        localStorage.removeItem(url);
      }
    }

    return next.handle(req).pipe(
      catchError(this.errorHandler),
      tap((item) => {
        if (item instanceof HttpResponse) {
          this.addToCache(item, url);
        }
      })
    );
  }

  isCacheExpired(cachedData: Cache_): boolean {
    return +new Date() - +cachedData.timestamp > this.cacheExpirationTime;
  }

  addToCache(item: HttpResponse<Forcast>, url: string) {
    if (localStorage.length <= this.BUFFER_SIZE)
      localStorage.setItem(
        url,
        JSON.stringify({ cache: item.body, cachedAt: new Date() })
      );
    else localStorage.clear();
  }
  errorHandler(err: HttpErrorResponse) {
    //err.error = {cod, message}
    return throwError(() => {
      let message: string = 'Unkown error';
      if (!err.error) throw new Error(message);
      switch (err.error.cod) {
        case 401: {
          message = 'unauthorized to make this request';
          break;
        }
        case 404: {
          message = 'requested resource was not found';
          break;
        }
        case 429: {
          message = err.error.message;
          break;
        }
        default:
          message = 'internal server error';
          break;
      }

      throw new Error(message);
    });
  }
}
