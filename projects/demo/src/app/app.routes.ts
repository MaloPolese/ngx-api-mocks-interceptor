import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'blog',
  },
  {
    path: '',
    loadComponent: () => import('./common/layouts/main-layout/main-layout'),
    children: [
      {
        path: 'blog',
        loadComponent: () => import('./pages/articles/articles'),
      },
      {
        path: 'article/form',
        loadComponent: () => import('./pages/articles/form/form'),
      },
      {
        path: 'article/form/:id',
        loadComponent: () => import('./pages/articles/form/form'),
      },
      {
        path: 'article/:id',
        loadComponent: () => import('./pages/articles/details/details'),
      },
    ],
  },
];
