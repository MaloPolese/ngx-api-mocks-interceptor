import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'todo',
  },
  {
    path: 'todo',
    loadComponent: () => import('./pages/todos/todos'),
  },
  {
    path: 'todo/form',
    loadComponent: () => import('./pages/form/form'),
  },
  {
    path: 'todo/form/:id',
    loadComponent: () => import('./pages/form/form'),
  },
  {
    path: 'todo/:id',
    loadComponent: () => import('./pages/todos/todo/todo'),
  },
];
