/* eslint-disable  @typescript-eslint/no-explicit-any */

import { HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { match } from '../router/router-match';
import { createRouteCounter } from '../router/router-counter';
import { MockRouterRef } from '../router/mock-router';
import { of } from 'rxjs';

describe('RouterMatch', () => {
  let mockRouter: MockRouterRef;

  beforeEach(() => {
    mockRouter = {
      req: new HttpRequest('GET', '/api/test'),
      mockRouterConfiguration: {
        pathMatch: 'prefix',
        skipAll: false,
        routes: [],
      },
      resolve: () => of(new HttpResponse()),
    };
  });

  describe('URL matching', () => {
    it('should match exact paths', () => {
      const matcher = match('/api/test', 'GET', () => new HttpResponse());
      expect(matcher.match(mockRouter)).toBe(true);
    });

    it('should match paths with parameters', () => {
      mockRouter.req = new HttpRequest('GET', '/api/users/123');
      const matcher = match('/api/users/:id', 'GET', () => new HttpResponse());
      expect(matcher.match(mockRouter)).toBe(true);
    });

    it('should extract path parameters', () => {
      mockRouter.req = new HttpRequest('GET', '/api/users/123/posts/456');
      const matcher = match('/api/users/:userId/posts/:postId', 'GET', (req, params) => {
        expect(params).toEqual({ userId: '123', postId: '456' });
        return new HttpResponse();
      });

      matcher.match(mockRouter);
      matcher.resolve(mockRouter).subscribe();
    });
  });

  describe('HTTP methods', () => {
    it('should match correct HTTP method', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

      methods.forEach((method) => {
        mockRouter.req = new HttpRequest(method, '/api/test', {});
        const matcher = match('/api/test', method, () => new HttpResponse());
        expect(matcher.match(mockRouter)).toBe(true);
      });
    });

    it('should not match different HTTP method', () => {
      mockRouter.req = new HttpRequest('POST', '/api/test', {});
      const matcher = match('/api/test', 'GET', () => new HttpResponse());
      expect(matcher.match(mockRouter)).toBe(false);
    });
  });

  describe('Query parameters', () => {
    it('should match query parameters', () => {
      mockRouter.req = new HttpRequest('GET', '/api/test', null, {
        params: new HttpParams().set('key', 'value'),
      });

      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        queryParams: { key: 'value' },
      });

      expect(matcher.match(mockRouter)).toBe(true);
    });

    it('should match query parameters with regex', () => {
      mockRouter.req = new HttpRequest('GET', '/api/test', null, {
        params: new HttpParams().set('id', '123'),
      });

      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        queryParams: { id: /^\d+$/ },
      });

      expect(matcher.match(mockRouter)).toBe(true);
    });
  });

  describe('Headers', () => {
    it('should match headers', () => {
      mockRouter.req = new HttpRequest('GET', '/api/test', null, {
        headers: new HttpHeaders().set('Authorization', 'Bearer token'),
      });

      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        headers: { Authorization: 'Bearer token' },
      });

      expect(matcher.match(mockRouter)).toBe(true);
    });

    it('should match headers with regex', () => {
      mockRouter.req = new HttpRequest('GET', '/api/test', null, {
        headers: new HttpHeaders().set('Authorization', 'Bearer abc123'),
      });

      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        headers: { Authorization: /^Bearer \w+$/ },
      });

      expect(matcher.match(mockRouter)).toBe(true);
    });
  });

  describe('Counter patterns', () => {
    it('should handle count-based responses', (done) => {
      const counter = createRouteCounter();
      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        counter,
        responses: [
          { count: 1, response: () => new HttpResponse({ body: 'first' }) },
          { count: 2, response: () => new HttpResponse({ body: 'second' }) },
        ],
      });

      matcher.resolve(mockRouter).subscribe((response) => {
        expect((response as HttpResponse<any>).body).toBe('first');

        matcher.resolve(mockRouter).subscribe((response2) => {
          expect((response2 as HttpResponse<any>).body).toBe('second');
          done();
        });
      });
    });

    it('should handle pattern "even"', () => {
      const counter = createRouteCounter();
      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        counter,
        responses: [
          { count: 'even', response: () => new HttpResponse({ body: 'even' }) },
          { count: 'odd', response: () => new HttpResponse({ body: 'odd' }) },
        ],
      });

      counter.increment(); // 1 => odd
      // resolve add one more time to be even
      matcher.resolve(mockRouter).subscribe((response) => {
        expect((response as HttpResponse<any>).body).toBe('even');
      });
    });

    it('should handle pattern "odd"', () => {
      const counter = createRouteCounter();
      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        counter,
        responses: [
          { count: 'even', response: () => new HttpResponse({ body: 'even' }) },
          { count: 'odd', response: () => new HttpResponse({ body: 'odd' }) },
        ],
      });

      counter.increment(); // 1 => odd
      counter.increment(); // 2 => even

      // resolve add one more time to be odd
      matcher.resolve(mockRouter).subscribe((response) => {
        expect((response as HttpResponse<any>).body).toBe('odd');
      });
    });
  });

  describe('Response handling', () => {
    it('should handle Observable responses', (done) => {
      const matcher = match('/api/test', 'GET', () => of(new HttpResponse({ body: 'test' })));

      matcher.resolve(mockRouter).subscribe((response) => {
        expect((response as HttpResponse<any>).body).toBe('test');
        done();
      });
    });

    it('should handle delay configuration', (done) => {
      const matcher = match('/api/test', 'GET', () => new HttpResponse(), {
        delay: 100,
      });

      const start = Date.now();
      matcher.resolve(mockRouter).subscribe(() => {
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(100);
        done();
      });
    });
  });
});
