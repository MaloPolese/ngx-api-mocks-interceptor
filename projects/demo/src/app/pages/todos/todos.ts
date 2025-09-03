import { Component, inject } from '@angular/core';
import { TodoService } from '../../core/api/services/todo.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateTodo } from '../../core/api/types/todo.type';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-todos',
  imports: [RouterLink, ReactiveFormsModule, JsonPipe],
  templateUrl: './todos.html',
  styleUrl: './todos.scss',
})
export default class Todos {
  private readonly todoService = inject(TodoService);
  public readonly formGroup = inject(FormBuilder).nonNullable.group({
    label: ['', Validators.required],
    description: [''],
  });

  download() {
    this.todoService.download().subscribe({
      next: (blob) => {
        console.log('File downloaded successfully');
        const filename = 'todos.txt';
        saveAs(blob, filename);
      },
      error: (error) => {
        console.error('Download error:', error);
      },
    });
  }

  todos = rxResource({
    stream: () => this.todoService.findAll(),
    defaultValue: [],
  });

  submit() {
    const values = this.formGroup.value;
    const todo: CreateTodo = {
      label: values.label!,
      description: values.description,
      completed: false,
    };
    this.todoService.create(todo).subscribe((newTodo) => this.todos.update((todos) => todos.concat(newTodo)));
  }
}
