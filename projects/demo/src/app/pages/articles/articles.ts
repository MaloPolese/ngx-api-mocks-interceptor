import { Component, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { JsonPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ArticleService } from '../../core/api/services/article.service';
import { ArticleComponent } from '../../common/components/article/article';
import { SpinnerComponent } from '../../common/components/spinner/spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-articles',
  imports: [ReactiveFormsModule, JsonPipe, ArticleComponent, SpinnerComponent, RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
})
export default class ArticlesComponent {
  private readonly articleService = inject(ArticleService);

  searchFormControl = inject(FormBuilder).control('');

  query = toSignal(this.searchFormControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()));

  articles = rxResource({
    params: () => ({
      query: this.query(),
    }),
    stream: ({ params: { query } }) => this.articleService.findAll(query),
    defaultValue: [],
  });
}
