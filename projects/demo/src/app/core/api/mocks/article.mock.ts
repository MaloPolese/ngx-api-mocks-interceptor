import { autoIncrement, mocks, randomLorem } from 'ngx-api-mocks-interceptor';
import type { Article } from '../types/article.type';
import { faker } from '@faker-js/faker';

export const articlesMock = mocks<Article>(
  {
    id: autoIncrement(1),
    title: () => faker.lorem.words(3),
    description: randomLorem(6),
    thumbnail: () => faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
    author: {
      id: autoIncrement(1),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
    },
    createdAt: () => faker.date.past().toISOString(),
    updatedAt: () => faker.date.past().toISOString(),
    content: () => faker.lorem.paragraphs(5, '\n\n'),
  },
  {
    count: 10,
  }
);
