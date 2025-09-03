import { inject, Injectable } from '@angular/core';
import { EnvironmentService } from '../../services/environment.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTodo, Todo } from '../types/todo.type';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  endpoint = inject(EnvironmentService).api.todo;
  http = inject(HttpClient);

  findAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(`${this.endpoint}/todo/item`);
  }

  get(id: number): Observable<Todo> {
    return this.http.get<Todo>(`${this.endpoint}/todo/item/${id}`);
  }

  create(body: CreateTodo): Observable<Todo> {
    return this.http.post<Todo>(`${this.endpoint}/todo/item`, body);
  }

  update(todo: Todo): Observable<Todo> {
    return this.http.put<Todo>(`${this.endpoint}/todo/item`, todo);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/todo/item/${id}`);
  }

  download(): Observable<Blob> {
    return this.http.get(`${this.endpoint}/todo/item/download`, { responseType: 'blob' });
  }
}
