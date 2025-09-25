import { Component, input } from '@angular/core';
import { Article } from '../../../core/api/types/article.type';

@Component({
  selector: 'app-article',
  imports: [],
  templateUrl: './article.html',
  styleUrl: './article.scss',
})
export class ArticleComponent {
  article = input.required<Article>();
}
