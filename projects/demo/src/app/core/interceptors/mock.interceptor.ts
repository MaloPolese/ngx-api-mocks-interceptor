import { HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { createRouteCounter, match, mockRouter } from 'ngx-api-mocks-interceptor';
import { of } from 'rxjs';
import { articlesMock } from '../api/mocks/article.mock';
import { EnvironmentService } from '../services/environment.service';
import { inject } from '@angular/core';

const findAllArticlesCounter = createRouteCounter();

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  const endpoint = inject(EnvironmentService).api.blog;

  return mockRouter(req, next, {
    delay: 500,
    pathMatch: 'full',
    routes: [
      match(
        `${endpoint}/article`,
        'GET',
        (req) => {
          const q = req.params.get('q');

          let articles = articlesMock.value;
          if (q) {
            articles = articles.filter(
              (article) =>
                article.title.toLowerCase().includes(q.toLowerCase()) ||
                article?.description?.toLowerCase()?.includes(q.toLowerCase()) ||
                article?.author?.firstName?.toLowerCase().includes(q.toLowerCase()) ||
                article?.author?.lastName?.toLowerCase().includes(q.toLowerCase())
            );
          }

          articles = articles.sort((a, b) => (a.updatedAt && b.updatedAt ? (a.updatedAt > b.updatedAt ? -1 : 1) : 0));

          return new HttpResponse({ status: 200, body: articles });
        },
        {
          delay: 200,
          counter: findAllArticlesCounter,
          responses: [
            {
              count: '3n',
              response: () =>
                new HttpResponse({
                  status: 429,
                  body: { error: 'Rate limited' },
                }),
            },
          ],
        }
      ),

      match(`${endpoint}/article/:id`, 'GET', (_, params) => {
        const article = articlesMock.get((article) => article.id === +params.id);
        if (article) {
          return new HttpResponse({ status: 200, body: article });
        }
        return new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Article not found' } });
      }),

      match(`${endpoint}/article`, 'POST', (req) => {
        const body = req.body as Partial<(typeof articlesMock.value)[number]>;
        if (!body.title || !body.description || !body.content) {
          return new HttpResponse({ status: HttpStatusCode.BadRequest, body: { error: 'Missing fields' } });
        }

        const now = new Date().toISOString();
        const newArticle = articlesMock.add({
          ...body,
          createdAt: now,
          updatedAt: now,
        });
        return new HttpResponse({ status: 201, body: newArticle });
      }),

      match(`${endpoint}/article`, 'PUT', (req) => {
        const body = req.body as Partial<(typeof articlesMock.value)[number]> & { id?: number };
        if (!body.id || !body.title || !body.description || !body.content) {
          return new HttpResponse({ status: HttpStatusCode.BadRequest, body: { error: 'Missing fields' } });
        }
        articlesMock.update((articles) =>
          articles.map((article) =>
            article.id === body.id ? { ...article, ...body, updatedAt: new Date().toISOString() } : article
          )
        );
        const updatedArticle = articlesMock.get((article) => article.id === body.id);
        if (updatedArticle) {
          return new HttpResponse({ status: 200, body: updatedArticle });
        }
        return new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Article not found' } });
      }),

      match(`${endpoint}/article/:id`, 'DELETE', (_, params) => {
        const deleted = articlesMock.remove((article) => article.id === +params.id);
        if (deleted) {
          return new HttpResponse({ status: 204 });
        }
        return new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Article not found' } });
      }),
    ],
    onNoMatch: () => of(new HttpResponse({ status: HttpStatusCode.NotFound, body: { error: 'Not Found' } })),
  });
};
