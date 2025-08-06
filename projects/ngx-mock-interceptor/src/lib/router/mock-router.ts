import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, throwError } from 'rxjs';
import { MockRouterMatchRef } from './router-match';

export type MockResponseType<T> =
  | HttpEvent<T> // Base type for all HTTP events
  | HttpEvent<T>[] // Array of events (for progress)
  | Observable<HttpEvent<T>>;

type ExtractParamNames<S extends string> = S extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParamNames<`/${Rest}`>
  : S extends `${string}:${infer Param}`
  ? Param
  : never;

type ParamsFromPattern<S extends string> = {
  [K in ExtractParamNames<S>]: string;
};

export type MockOptionsDelay = number | { min: number; max: number };

export type PathMatchOptions = 'full' | 'prefix';

export type MockRouterConfiguration = {
  routes: MockRouterMatchRef[];
  delay?: MockOptionsDelay;
  pathMatch?: PathMatchOptions;
  skipAll?: boolean;
  onNoMatch?: () => Observable<HttpEvent<unknown>>;
};

export interface MatchConfig {
  queryParams?: {
    [key: string]: string | RegExp;
  };
  headers?: {
    [key: string]: string | RegExp;
  };
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
    }

    if (this.mockRouterConfiguration.onNoMatch) {
      return this.mockRouterConfiguration.onNoMatch().pipe(
        switchMap((response) => {
          if (response instanceof HttpResponse) {
            return response.ok
              ? of(response)
              : throwError(
                  () =>
                    new HttpErrorResponse({
                      error: response.body,
                      status: response.status,
                      statusText: response.statusText,
                      url: this.req.url || undefined,
                      headers: response.headers,
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
