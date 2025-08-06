import { Component, inject } from '@angular/core';
import { TodoService } from '../../../core/api/services/todo.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, of, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-todo',
  imports: [],
  templateUrl: './todo.html',
  styleUrl: './todo.scss',
})
export default class Todo {
  private readonly todoService = inject(TodoService);

  todoId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => (id ? of(+id) : throwError(() => 'id cannot be undefined')))
    ),
    {
      requireSync: true,
    }
  );

  todo = rxResource({
    params: () => ({
      id: this.todoId(),
    }),
    stream: ({ params: { id } }) => this.todoService.get(id),
  });
}
