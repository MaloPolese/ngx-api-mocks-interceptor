import { HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { mockRouter, MockRouterConfiguration } from '../router/mock-router';
import { match } from '../router/router-match';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import 'zone.js';

describe('MockRouter', () => {
  let routerConfig: MockRouterConfiguration;
  let handler: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Router],
    });

    routerConfig = {
      pathMatch: 'prefix',
      skipAll: false,
      routes: [],
    };

    handler = () => of(new HttpResponse());
  });

  describe('Route Configuration', () => {
    it('should create router with default configuration', () => {
      const request = new HttpRequest('GET', '/api/test');
      const router$ = mockRouter(request, handler, routerConfig);

      expect(router$).toBeTruthy();
      expect(routerConfig.pathMatch).toBe('prefix');
      expect(routerConfig.skipAll).toBeFalse();
      expect(routerConfig.routes).toEqual([]);
    });

    it('should add routes', () => {
      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse());
        routerConfig.routes.push(route);
        expect(routerConfig.routes.length).toBe(1);
      });
    });

    it('should clear routes', () => {
      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse());
        routerConfig.routes.push(route);
        routerConfig.routes = [];
        expect(routerConfig.routes.length).toBe(0);
      });
    });
  });

  describe('Request Handling', () => {
    it('should match and resolve request', (done) => {
      const expectedResponse = new HttpResponse({ body: 'test' });
      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => expectedResponse);
        routerConfig.routes.push(route);
      });

      const request = new HttpRequest('GET', '/api/test');
      mockRouter(request, handler, routerConfig).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        done();
      });
    });

    it('should return 404 for unmatched routes', (done) => {
      const request = new HttpRequest('GET', '/api/nonexistent');

      routerConfig.onNoMatch = () => of(new HttpResponse({ status: 404 }));

      mockRouter(request, handler, routerConfig).subscribe({
        error: (err) => {
          expect(err.status ?? err?.cause?.status).toBe(404);
          done();
        },
      });
    });

    it('should skip all requests when skipAll is true', (done) => {
      routerConfig.skipAll = true;

      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse());
        routerConfig.routes.push(route);
        routerConfig.onNoMatch = () => of(new HttpResponse({ status: 404 }));
      });

      const request = new HttpRequest('GET', '/api/test');
      mockRouter(request, handler, routerConfig).subscribe({
        error: (err) => {
          expect(err.status ?? err?.cause?.status).toBe(404);
          done();
        },
      });
    });
  });

  describe('Path Matching', () => {
    it('should match exact paths when pathMatch is full', (done) => {
      routerConfig.pathMatch = 'full';
      routerConfig.onNoMatch = () => of(new HttpResponse({ status: 404 }));

      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse({ body: 'matched' }));
        routerConfig.routes.push(route);
      });

      const request = new HttpRequest('GET', '/api/test/extra');
      mockRouter(request, handler, routerConfig).subscribe({
        error: (err) => {
          expect(err.status ?? err?.cause?.status).toBe(404);
          done();
        },
      });
    });

    it('should match prefix paths when pathMatch is prefix', (done) => {
      routerConfig.pathMatch = 'prefix';

      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse({ body: 'matched' }));
        routerConfig.routes.push(route);
      });

      const request = new HttpRequest('GET', '/api/test/extra');
      mockRouter(request, handler, routerConfig).subscribe((response) => {
        expect((response as HttpResponse<unknown>).body).toBe('matched');
        done();
      });
    });
  });

  // describe('Route Priority', () => {
  //   it('should match most specific route first', (done) => {
  //     const genericRoute = match('/api/:id', 'GET', () => new HttpResponse({ body: 'generic' }));
  //     const specificRoute = match('/api/test', 'GET', () => new HttpResponse({ body: 'specific' }));

  //     routerConfig.routes.push(genericRoute);
  //     routerConfig.routes.push(specificRoute);

  //     const request = new HttpRequest('GET', '/api/test');
  //     mockRouter(request, handler, routerConfig).subscribe((response) => {
  //       expect((response as HttpResponse<unknown>).body).toBe('specific');
  //       done();
  //     });
  //   });
  // });

  describe('Error Handling', () => {
    it('should handle errors in route handlers', (done) => {
      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => new HttpResponse({ status: 404, body: 'Test error' }));
        routerConfig.routes.push(route);
      });

      const request = new HttpRequest('GET', '/api/test');
      mockRouter(request, handler, routerConfig).subscribe({
        error: (err) => {
          expect(err.status ?? err?.cause?.error).toBe('Test error');
          done();
        },
      });
    });

    it('should handle async errors in route handlers', (done) => {
      TestBed.runInInjectionContext(() => {
        const route = match('/api/test', 'GET', () => {
          return of(new HttpResponse()).pipe(
            map(() => {
              throw new Error('Async error');
            })
          );
        });
        routerConfig.routes.push(route);
      });

      const request = new HttpRequest('GET', '/api/test');
      mockRouter(request, handler, routerConfig).subscribe({
        error: (error) => {
          expect(error.message).toBe('Async error');
          done();
        },
      });
    });
  });
});
