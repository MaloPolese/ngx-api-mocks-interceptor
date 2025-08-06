import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  get api() {
    return environment.api;
  }
}
