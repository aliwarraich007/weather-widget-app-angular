import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  loading: boolean = false;
  toggleLoading(val: boolean) {
    this.loading = val;
  }
}
