<h1 align="center">Ngx API Mock Interceptor</h1>

<div align="center">

[![npm version](https://img.shields.io/npm/v/ngx-api-mocks-interceptor.svg?style=flat-square)](https://www.npmjs.com/package/ngx-api-mocks-interceptor)
[![npm downloads](https://img.shields.io/npm/dm/ngx-api-mocks-interceptor.svg?style=flat-square)](https://www.npmjs.com/package/ngx-api-mocks-interceptor)
[![CI Quality](https://img.shields.io/github/actions/workflow/status/MaloPolese/ngx-api-mocks-interceptor/quality.yml?branch=main)](https://github.com/MaloPolese/ngx-api-mocks-interceptor/tree/main)
[![License](https://img.shields.io/github/license/MaloPolese/ngx-api-mocks-interceptor?style=flat-square&logo=GNU&label=License)](https://github.com/MaloPolese/ngx-api-mocks-interceptor/tree/main)
[![Angular Version](https://img.shields.io/github/package-json/dependency-version/MaloPolese/ngx-api-mocks-interceptor/@angular/core?style=flat-square&label=angular)](https://angular.io/)

</div>

A powerful HTTP mock interceptor for Angular applications that helps you simulate API responses during development and testing.

🔥 [Live Demo](https://malopolese.github.io/ngx-api-mocks-interceptor/)

## Features

- 🚀 Easy to set up and use
- 🎯 Path matching with typed parameters support
- 📝 Query parameters and headers matching
- ⏱️ Configurable response delays
- 🔄 Counter-based responses
- 🎮 Full control over mock responses
- 📦 Mock data factory
- 🔄 Progress events simulation
- 📁 File download simulation

## Installation

```bash
npm i ngx-api-mocks-interceptor
```

## Quick Start

1. Create and Import the interceptor in your app.config.ts:

```bash
ng g interceptor mockInterceptor
```

```typescript
import { HttpInterceptorFn } from "@angular/common/http";

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([mockInterceptor]))],
};
```

2. Create your mock data using the factory:

```typescript
import { autoIncrement, boolean, mocks, randomLorem } from "ngx-api-mocks-interceptor";
import { faker } from "@faker-js/faker";

interface Todo {
  id: number;
  label: string;
  description: string;
  completed: boolean;
  options: {
    id: number;
    name: string;
  };
}

// Create several mocks with the `mocks` factory
export const todosMock = mocks<Todo>(
  {
    id: autoIncrement(1),
    label: () => faker.lorem.words(3), // We can use faker or any other generator
    description: randomLorem(6),
    completed: boolean(0.3),
    options: {
      id: autoIncrement(1),
      name: randomLorem(),
    },
  },
  {
    count: 10, // Generate 10 items
  }
);

// Or a single mock with the `mock` factory
export const todoMock = mock<Todo>({
  id: autoIncrement(1),
  label: () => faker.lorem.words(3),
  description: randomLorem(6),
  completed: boolean(0.3),
  options: {
    id: autoIncrement(1),
    name: randomLorem(),
  },
});
```

3. Configure your mock interceptor:

```typescript
import { match, mockRouter } from "ngx-api-mocks-interceptor";

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const endpoint = "http://localhost:3000/api/v1";

  return mockRouter(req, next, {
    delay: 1000,
    pathMatch: "full",
    routes: [
      match(`${endpoint}/api/todos/`, "GET", () => new HttpResponse({ status: 200, body: todosMock.value })),
      match(`${endpoint}/api/todos/:id`, "GET", (_, params) => {
        const todo = todosMock.get((todo) => todo.id === +params.id);
        return new HttpResponse({ status: 200, body: todo });
      }),
      match(
        `${endpoint}/api/todos`,
        "POST",
        (req: HttpRequest<Partial<Todo>>) =>
          new HttpResponse({
            status: 201,
            body: todosMock.add(req.body!),
          })
      ),
    ],
    // Handle unmatched routes
    onNoMatch: () => of(new HttpResponse({ status: 404, body: { error: "Not Found" } })),
  });
};
```

4. Advenced configuration:

```typescript
import { createRouteCounter, match, mockRouter, createFileMockResponse } from "ngx-api-mocks-interceptor";

const getItemCounter = createRouteCounter();
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const endpoint = "http://localhost:3000/api/v1";

  return mockRouter(req, next, {
    delay: 1000, // Global delay
    pathMatch: "full",
    routes: [
      match(
        `${endpoint}/api/todos`,
        "GET",
        () =>
          new HttpResponse({
            status: 200,
            body: todosMock.value,
          }),
        {
          delay: 800,
          counter: getItemCounter,
          responses: [
            {
              count: "2n", // Every second request
              response: () =>
                new HttpResponse({
                  status: 429,
                  body: { error: "Rate limited" },
                }),
            },
            {
              count: ">5", // After 5 requests
              response: () =>
                new HttpResponse({
                  status: 503,
                  body: { error: "Service degraded" },
                }),
            },
          ],
        }
      ),

      // GET with path parameters
      match(`${endpoint}/api/todos/:id`, "GET", (_, params) => {
        const todo = todosMock.get((todo) => todo.id === +params.id);
        return new HttpResponse({ status: 200, body: todo });
      }),

      // POST with request body
      match(
        `${endpoint}/api/todos`,
        "POST",
        (req: HttpRequest<Partial<Todo>>) =>
          new HttpResponse({
            status: 201,
            body: todosMock.add(req.body!),
          })
      ),

      // File download simulation
      match(`${endpoint}/api/todos/download`, "GET", () =>
        createFileMockResponse({
          path: "/mocks/example.txt",
          filename: "todos.txt",
          contentType: "text/plain",
          headers: {
            "Cache-Control": "no-cache",
          },
          chunkDelay: 200,
        })
      ),

      // Upload progress simulation
      match(`${endpoint}/api/upload`, "POST", () => [
        {
          type: HttpEventType.UploadProgress,
          loaded: 0,
          total: 100,
        },
        {
          type: HttpEventType.UploadProgress,
          loaded: 50,
          total: 100,
        },
        new HttpResponse({
          status: 200,
          body: { message: "Upload complete" },
        }),
      ]),
    ],
    // Handle unmatched routes
    onNoMatch: () =>
      of(
        new HttpResponse({
          status: 404,
          body: { error: "Not Found" },
        })
      ),
  });
};
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
