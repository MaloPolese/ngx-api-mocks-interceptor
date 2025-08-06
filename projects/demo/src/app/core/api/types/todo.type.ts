export interface Todo {
  id: number;
  label: string;
  description?: string;
  completed: boolean;
  options: {
    id: number;
    name: string;
  };
}

export type CreateTodo = Partial<Todo> & Pick<Todo, 'label' | 'completed' | 'description'>;
