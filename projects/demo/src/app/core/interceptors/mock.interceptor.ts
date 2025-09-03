import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { createFileMockResponse, createRouteCounter, match, mockRouter } from 'ngx-mock-interceptor';
import { EnvironmentService } from '../services/environment.service';
import { inject } from '@angular/core';
import { todosMock } from '../api/mocks/todo.mock';

const getItemCounter = createRouteCounter();

export function mockInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const endpoint = inject(EnvironmentService).api.todo;

  return mockRouter(req, next, {
    delay: 1000,
    pathMatch: 'full',
    routes: [
      match(`${endpoint}/todo/item`, 'GET', () => new HttpResponse({ status: 200, body: todosMock.value }), {
        delay: 800,
        counter: getItemCounter,
        responses: [
          {
            count: '2n', // Every second request
            response: () =>
              new HttpResponse({
                status: 429,
                body: { error: 'Rate limited' },
              }),
          },
          {
            count: '>5', // After 5 requests
            response: () =>
              new HttpResponse({
                status: 503,
                body: { error: 'Service degraded' },
              }),
          },
        ],
      }),
      match(`${endpoint}/todo/item/:id`, 'GET', (_, params) => {
        const todo = todosMock.get((todo) => todo.id === +params.id);
        return new HttpResponse({ status: 200, body: todo });
      }),
      match(`${endpoint}/todo/item`, 'GET', () => new HttpResponse({ status: 200, body: todosMock.value })),
      match(`${endpoint}/todo/item/download`, 'GET', () =>
        createFileMockResponse({
          path: '/mocks/example.txt',
          filename: 'todos.txt',
          contentType: 'text/plain',
          headers: {
            'Cache-Control': 'no-cache',
          },
          chunkDelay: 200,
        })
      ),
    ],
    onNoMatch: () => of(new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Not Found' } })),
  });
  /*
  return mockRouter(req, next, {
    delay: 1000,
  })
    .match(`${endpoint}/todo/item`, 'GET', () => new HttpResponse({ status: 200, body: todosMock.value }), {
      delay: 800,
      responses: [
        {
          count: '2n', // Every second request
          response: () =>
            new HttpResponse({
              status: 429,
              body: { error: 'Rate limited' },
            }),
        },
        {
          count: '>5', // After 5 requests
          response: () =>
            new HttpResponse({
              status: 503,
              body: { error: 'Service degraded' },
            }),
        },
      ],
    })
    .match(`${endpoint}/todo/item/download`, 'GET', () => {
      return createFileMockResponse({
        path: '/mocks/example.txt', // This path is relative to the public folder
        filename: 'todos.txt',
        contentType: 'text/plain',
        headers: {
          'Cache-Control': 'no-cache',
        },
        chunkDelay: 200,
      });
    })
    .match(`${endpoint}/todo/item/:id`, 'GET', (req, params) => {
      const todo = todosMock.get((todo) => todo.id === +params.id);
      if (todo) {
        return new HttpResponse({ status: HttpStatusCode.Ok, body: todo });
      }
      return new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Todo not found' } });
    })

    .match(`${endpoint}/todo/item`, 'POST', (req: HttpRequest<CreateTodo>) => {
      return new HttpResponse({
        status: HttpStatusCode.Ok,
        body: todosMock.add(req.body!),
      });
    })
    .match(`${endpoint}/todo/item/:id`, 'PUT', () => new HttpResponse({ status: 200, body: [] }), {
      delay: { min: 500, max: 1500 },
    })
    .match(`${endpoint}/todo/item/:id`, 'DELETE', (_, params) => {
      todosMock.remove((a) => a.id === +params.id);
      return new HttpResponse({ status: HttpStatusCode.Ok });
    })

    .match('/api/upload', 'POST', () => [
      {
        type: HttpEventType.UploadProgress,
        loaded: 0,
        total: 100,
      } as HttpProgressEvent,
      {
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 100,
      } as HttpProgressEvent,
      new HttpResponse({
        status: 200,
        body: { message: 'Upload complete' },
      }),
    ])
    .match(
      '/api/download',
      'GET',
      () =>
        new Observable<HttpEvent<unknown>>((observer) => {
          // Send download progress
          observer.next({
            type: HttpEventType.DownloadProgress,
            loaded: 0,
            total: 100,
          });

          // Simulate chunks
          setTimeout(() => {
            observer.next({
              type: HttpEventType.DownloadProgress,
              loaded: 50,
              total: 100,
            });
          }, 500);

          // Complete with response
          setTimeout(() => {
            observer.next(
              new HttpResponse({
                status: 200,
                body: { data: 'Download complete' },
              })
            );
            observer.complete();
          }, 1000);
        })
    )
    .resolve(() => {
      console.warn('No mock response found for the request:', req);
      return of(new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Not Found' } }));
    });
    */
}
