import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { MockRouterMatchRef } from './router-match';

export type MockResponseType<T> =
  | HttpEvent<T> // Base type for all HTTP events
  | HttpEvent<T>[] // Array of events (for progress)
  | Observable<HttpEvent<T>>;

export type MockOptionsDelay = number | { min: number; max: number };

export type PathMatchOptions = 'full' | 'prefix';

export interface MockRouterConfiguration {
  routes: MockRouterMatchRef[];
  delay?: MockOptionsDelay;
  pathMatch?: PathMatchOptions;
  skipAll?: boolean;
  onNoMatch?: () => Observable<HttpEvent<unknown>>;
}

export interface MatchConfig {
  queryParams?: Record<string, string | RegExp>;
  headers?: Record<string, string | RegExp>;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  body?: any | ((body: any) => boolean);
}

export interface MockRouterRef {
  mockRouterConfiguration?: MockRouterConfiguration;
  req: HttpRequest<unknown>;
  resolve(): Observable<HttpEvent<unknown>>;
}

class MockRouterImpl implements MockRouterRef {
  constructor(
    public req: HttpRequest<unknown>,
    private next: HttpHandlerFn,
    public mockRouterConfiguration: MockRouterConfiguration
  ) {}

  resolve(): Observable<HttpEvent<unknown>> {
    if (!this.mockRouterConfiguration.skipAll) {
      for (const route of this.mockRouterConfiguration.routes) {
        if (route.match(this)) {
          return route.resolve(this);
        }
      }
      console.warn(`[MOCK-INTERCEPTOR] unresolve ${this.req.method} ${this.req.url}`);
    }

    if (this.mockRouterConfiguration.onNoMatch) {
      return this.mockRouterConfiguration.onNoMatch().pipe(
        switchMap((response) => {
          if (response instanceof HttpResponse && !response.ok) {
            return throwError(
              () =>
                new Error(`HTTP Error: ${response.status} ${response.statusText} - url: ${this.req.url}`, {
                  // Have to wrap HttpErrorResponse in Error because HttpErrorResponse is not an instance of Error
                  // which causes issues in some error handling libraries (like rxResource api)
                  cause: new HttpErrorResponse({
                    error: response.body,
                    status: response.status,
                    statusText: response.statusText,
                    url: this.req.url || undefined,
                    headers: response.headers,
                  }),
                })
            );
          }
          return of(response);
        })
      );
    }
    return this.next(this.req);
  }
}

export function mockRouter(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  mockRouterConfiguration: MockRouterConfiguration
): Observable<HttpEvent<unknown>> {
  const mockRouter = new MockRouterImpl(req, next, mockRouterConfiguration);

  return mockRouter.resolve();
}
