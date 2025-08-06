import { autoIncrement, boolean, mocks, randomLorem } from 'ngx-mock-interceptor';
import { Todo } from '../types/todo.type';

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
    count: 10,
  }
);
