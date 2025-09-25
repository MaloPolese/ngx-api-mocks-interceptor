export interface Article {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  content: string;
  author?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type CreateArticle = Pick<Article, 'title' | 'description' | 'thumbnail' | 'content'>;
export type UpdateArticle = Partial<CreateArticle> & Pick<Article, 'id'>;
