import { inject, Injectable } from '@angular/core';
import { EnvironmentService } from '../../services/environment.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateArticle, Article } from '../types/article.type';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  endpoint = inject(EnvironmentService).api.blog + '/article';
  http = inject(HttpClient);

  findAll(q?: string | null): Observable<Article[]> {
    const params = {};
    if (q) {
      Object.assign(params, { q });
    }

    return this.http.get<Article[]>(`${this.endpoint}`, {
      params,
    });
  }

  get(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.endpoint}/${id}`);
  }

  create(body: CreateArticle): Observable<Article> {
    return this.http.post<Article>(`${this.endpoint}`, body);
  }

  update(todo: Article): Observable<Article> {
    return this.http.put<Article>(`${this.endpoint}`, todo);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  download(): Observable<Blob> {
    return this.http.get(`${this.endpoint}/download`, { responseType: 'blob' });
  }
}
