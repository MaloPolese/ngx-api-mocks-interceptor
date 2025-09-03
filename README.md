# NgxMockInterceptor

A powerful HTTP mock interceptor for Angular applications that helps you simulate API responses during development and testing.

## Features

- 🚀 Easy to set up and use
- 🎯 Path matching with parameters support
- 📝 Query parameters and headers matching
- ⏱️ Configurable response delays
- 🔄 Counter-based responses
- 🎮 Full control over mock responses
- 📦 Mock data factory
- 🔄 Progress events simulation
- 📁 File download simulation

## Installation

```bash
pnpm add ngx-mock-interceptor
```

## Quick Start

1. Import the MockInterceptor in your app.config.ts:

```typescript
import { mockInterceptor } from "ngx-mock-interceptor";

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([mockInterceptor]))],
};
```

2. Create your mock data using the factory:

```typescript
import { autoIncrement, boolean, mocks, randomLorem } from "ngx-mock-interceptor";

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

// Create mock data factory
export const todosMock = mocks<Todo>(
  {
    id: autoIncrement(1),
    label: randomLorem(2),
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
```

3. Configure your mock interceptor:

```typescript
import { createRouteCounter, match, mockRouter, createFileMockResponse } from "ngx-mock-interceptor";

export function mockInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const getItemCounter = createRouteCounter();

  return mockRouter(req, next, {
    delay: 1000, // Global delay
    pathMatch: "full",
    routes: [
      // Basic GET with counter-based responses
      match(
        "/api/todos",
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
      match("/api/todos/:id", "GET", (_, params) => {
        const todo = todosMock.get((todo) => todo.id === +params.id);
        return new HttpResponse({ status: 200, body: todo });
      }),

      // POST with request body
      match(
        "/api/todos",
        "POST",
        (req: HttpRequest<Partial<Todo>>) =>
          new HttpResponse({
            status: 201,
            body: todosMock.add(req.body!),
          })
      ),

      // File download simulation
      match("/api/todos/download", "GET", () =>
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
      match("/api/upload", "POST", () => [
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
}
```

## Documentation

For detailed documentation and examples, visit our [Wiki](../../wiki).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
