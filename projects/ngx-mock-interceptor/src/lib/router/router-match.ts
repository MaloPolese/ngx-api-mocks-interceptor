import { HttpEvent, HttpRequest, HttpResponse, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, delay, switchMap, concat, throwError } from 'rxjs';
import { MockResponseType, MatchConfig, MockOptionsDelay, MockRouterRef, PathMatchOptions } from './mock-router';
import { RouteCounterRef } from './router-counter';

export type CountPattern =
  | number // exact match: 1, 2, 3
  | `${number}n` // every nth request: "2n", "3n"
  | 'odd' // odd-numbered requests
  | 'even' // even-numbered requests
  | `>${number}` // after n requests
  | `<${number}` // before n requests
  | `${number}-${number}`; // range of requests

export interface CountBasedResponse<T> {
  count: CountPattern;
  response: (req: HttpRequest<any>, params: T) => HttpResponse<unknown>;
}

export interface MockRouterMatchRef {
  match(mockRouter: MockRouterRef): boolean;
  resolve(mockRouter: MockRouterRef): Observable<HttpEvent<unknown>>;
}

type ExtractParamNames<S extends string> = S extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParamNames<`/${Rest}`>
  : S extends `${string}:${infer Param}`
  ? Param
  : never;

type ParamsFromPattern<S extends string> = {
  [K in ExtractParamNames<S>]: string;
};

export type MockRouterMatchOptions = {
  delay?: MockOptionsDelay;
  skip?: boolean;
} & (
  | {
      responses?: undefined;
      counter?: undefined;
    }
  | {
      responses: CountBasedResponse<any>[];
      counter: RouteCounterRef;
    }
);

class MockRouterMatchImpl implements MockRouterMatchRef {
  private _parmas = {};
  get parmas(): Record<string, string> {
    return this._parmas;
  }
  set parmas(value: Record<string, string>) {
    this._parmas = value;
  }

  constructor(
    private fullPattern: string,
    private method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH',
    private handler: (req: HttpRequest<any>, params: ParamsFromPattern<string>) => MockResponseType<unknown>,
    private options?: MockRouterMatchOptions & MatchConfig
  ) {}

  match(mockRouter: MockRouterRef): boolean {
    if (this.options?.skip || mockRouter.mockRouterConfiguration?.skipAll) {
      return false;
    }

    if (mockRouter.req.method === this.method) {
      const { isMatch, params } = this.parseUrl(
        mockRouter.mockRouterConfiguration?.pathMatch ?? 'prefix',
        this.fullPattern,
        mockRouter.req.url
      );

      this.parmas = params;

      if (!isMatch) {
        return false;
      }

      if (this.options) {
        if (!this.matchQueryParams(mockRouter.req.params, this.options.queryParams)) return false;
        if (!this.matchHeaders(mockRouter.req.headers, this.options.headers)) return false;
      }

      return true;
    }

    return false;
  }

  resolve(mockRouter: MockRouterRef): Observable<HttpEvent<unknown>> {
    if (this.options?.counter) {
      this.options.counter.increment();
    }

    let handlerFn =
      this.options?.responses?.find((response) =>
        this.matchesPattern(this.options?.counter?.get() ?? 0, response.count)
      )?.response || this.handler;

    const delayValue =
      this.calculateDelay(this.options?.delay) || this.calculateDelay(mockRouter.mockRouterConfiguration?.delay) || 0;

    const $response =
      handlerFn instanceof Observable
        ? (handlerFn(mockRouter.req, this.parmas) as Observable<HttpEvent<unknown>>)
        : of(handlerFn(mockRouter.req, this.parmas) as HttpEvent<undefined>);

    console.log(`[MOCK-INTERCEPTOR] resolve ${mockRouter.req.method} ${mockRouter.req.url} -> delay ${delayValue}ms`);

    return $response.pipe(
      delay(delayValue),
      switchMap((response) => {
        if (Array.isArray(response)) {
          return concat(...response.map((event) => of(event).pipe(delay(500))));
        }

        if (response instanceof Observable) {
          return response;
        }

        if (response instanceof HttpResponse) {
          return response.ok
            ? of(response)
            : throwError(
                () =>
                  new HttpErrorResponse({
                    error: response.body,
                    status: response.status,
                    statusText: response.statusText,
                    url: mockRouter.req.url || undefined,
                    headers: response.headers,
                  })
              );
        }

        if (this.isHttpEvent(response)) {
          return of(response);
        }

        return of(new HttpResponse({ body: response }));
      })
    );
  }

  private isHttpEvent(event: any): event is HttpEvent<unknown> {
    return event && typeof event.type === 'number';
  }

  private calculateDelay(delay: MockOptionsDelay | undefined): number {
    if (delay && typeof delay === 'object') {
      const { min, max } = delay;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (delay && typeof delay === 'number') {
      return delay;
    }
    return 0;
  }

  private matchesPattern(count: number, pattern: CountPattern): boolean {
    if (typeof pattern === 'number') {
      return count === pattern;
    }

    if (pattern === 'odd') {
      return count % 2 === 1;
    }

    if (pattern === 'even') {
      return count % 2 === 0;
    }

    if (pattern.includes('n')) {
      const n = parseInt(pattern);
      return count % n === 0;
    }

    if (pattern.startsWith('>')) {
      const threshold = parseInt(pattern.slice(1));
      return count > threshold;
    }

    if (pattern.startsWith('<')) {
      const threshold = parseInt(pattern.slice(1));
      return count < threshold;
    }

    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(Number);
      return count >= start && count <= end;
    }

    return false;
  }

  /**
   * Parses a URL pattern against an actual URL to extract path parameters.
   * @param pattern The URL pattern (e.g., '/api/v1/toto/:acid/file').
   * @param url The actual URL from the HttpRequest (e.g., '/api/v1/toto/A001/file').
   * @returns An object indicating if there's a match and any extracted parameters.
   */
  private parseUrl(
    pathMatch: PathMatchOptions,
    pattern: string,
    url: string
  ): { isMatch: boolean; params: Record<string, string> } {
    const params: Record<string, string> = {};

    // Normalize pattern and URL: remove leading/trailing slashes for consistent splitting
    const normalizedPattern = pattern.replace(/^\/|\/$/g, '');
    const normalizedUrl = url.replace(/^\/|\/$/g, '');

    const patternParts = normalizedPattern.split('/');
    const urlParts = normalizedUrl.split('/');

    // const pathMatch = this.?.pathMatch || 'prefix';
    if (pathMatch === 'full' && patternParts.length !== urlParts.length) {
      return { isMatch: false, params: {} };
    }

    if (pathMatch === 'prefix' && patternParts.length > urlParts.length) {
      return { isMatch: false, params: {} };
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const urlPart = urlParts[i];

      if (urlPart === undefined) {
        return { isMatch: false, params: {} };
      }

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        if (params[paramName] && params[paramName] !== urlPart) {
          throw new Error(
            `Parameter ${paramName} already defined with value ${params[paramName]}, cannot redefine with ${urlPart}`
          );
        }

        params[paramName] = urlPart;
      } else if (patternPart !== urlPart) {
        return { isMatch: false, params: {} };
      }
    }
    return { isMatch: true, params };
  }

  private matchQueryParams(requestParams: HttpParams, queryParams?: Record<string, string | RegExp>): boolean {
    if (!queryParams) return true;

    for (const [key, matcher] of Object.entries(queryParams)) {
      const value = requestParams.get(key);
      if (!value) return false;

      if (matcher instanceof RegExp) {
        if (!matcher.test(value)) return false;
      } else if (value !== matcher) {
        return false;
      }
    }
    return true;
  }

  private matchHeaders(requestHearder: HttpHeaders, headers?: Record<string, string | RegExp>): boolean {
    if (!headers) return true;

    for (const [key, matcher] of Object.entries(headers)) {
      const value = requestHearder.get(key);
      if (!value) return false;

      if (matcher instanceof RegExp) {
        if (!matcher.test(value)) return false;
      } else if (value !== matcher) {
        return false;
      }
    }
    return true;
  }
}

export function match<P extends string>(
  fullPattern: P,
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH',
  handler: (req: HttpRequest<any>, params: ParamsFromPattern<P>) => MockResponseType<unknown>,
  options?: MockRouterMatchOptions & MatchConfig
): MockRouterMatchRef {
  return new MockRouterMatchImpl(fullPattern, method, handler, options);
}
