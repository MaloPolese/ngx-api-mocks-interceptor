import {
  HttpEvent,
  HttpEventType,
  HttpErrorResponse,
  HttpResponse,
  HttpProgressEvent,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, from, throwError, defer, concatMap } from 'rxjs';

export interface MockFileOptions {
  path: string;
  filename?: string;
  contentType?: string;
  chunkDelay?: number;
  headers?: Record<string, string>;
}

export function createFileMockResponse(options: MockFileOptions): Observable<HttpEvent<unknown>> {
  return defer(() =>
    from(fetch(options.path)).pipe(
      concatMap((response) => {
        const fileSize = Number(response.headers.get('content-length'));
        const reader = response.body?.getReader();

        if (!reader) {
          return throwError(() => new Error('Unable to read file'));
        }

        const headers = new HttpHeaders({
          'Content-Type': options.contentType || response.headers.get('content-type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${options.filename || options.path.split('/').pop()}"`,
          ...options.headers,
        });

        return new Observable<HttpEvent<unknown>>((observer) => {
          let loadedBytes = 0;
          const chunks: Uint8Array[] = [];

          function readChunk() {
            reader?.read().then(
              ({ done, value }) => {
                if (done) {
                  // Combine all chunks and send final response
                  const fullFile = new Blob(chunks, {
                    type: options.contentType || response.headers.get('content-type') || 'application/octet-stream',
                  });

                  observer.next(
                    new HttpResponse({
                      status: 200,
                      headers,
                      body: fullFile,
                    })
                  );
                  observer.complete();
                  return;
                }

                if (value) {
                  chunks.push(value);
                  loadedBytes += value.length;
                  observer.next({
                    type: HttpEventType.DownloadProgress,
                    loaded: loadedBytes,
                    total: fileSize,
                  } as HttpProgressEvent);
                }

                if (options.chunkDelay) {
                  setTimeout(readChunk, options.chunkDelay);
                } else {
                  readChunk();
                }
              },
              (error) => {
                observer.error(
                  new HttpErrorResponse({
                    error: { message: `Failed to download file: ${error}` },
                    status: 500,
                  })
                );
              }
            );
          }

          readChunk();

          return () => {
            reader.cancel();
          };
        });
      })
    )
  );
}
