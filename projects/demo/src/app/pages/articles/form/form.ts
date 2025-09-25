import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../../core/api/services/article.service';
import { CreateArticle } from '../../../core/api/types/article.type';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, of, switchMap } from 'rxjs';
import { SpinnerComponent } from '../../../common/components/spinner/spinner';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, SpinnerComponent],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export default class ArticleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private articleService = inject(ArticleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isUpdate = false;
  articleId?: number;

  // Fix form typing using NonNullableFormBuilder
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', Validators.required],
    thumbnail: [''],
    content: ['', Validators.required],
  });

  // Update rxResource usage
  article = rxResource({
    stream: () => {
      if (!this.articleId) return EMPTY;

      return this.articleService.get(this.articleId).pipe(
        switchMap((article) => {
          this.form.patchValue({
            title: article.title,
            description: article.description || '',
            thumbnail: article.thumbnail || '',
            content: article.content,
          });
          return of(article);
        })
      );
    },
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isUpdate = true;
      this.articleId = +id;
      this.article.reload();
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue();

    // hardcoded author
    const author = { id: 1, firstName: 'John', lastName: 'Doe' };
    const formValueWithAuthor: CreateArticle & { author: typeof author } = { ...formValue, author };

    const request$ =
      this.isUpdate && this.articleId
        ? this.articleService.update({ ...formValueWithAuthor, id: this.articleId })
        : this.articleService.create(formValueWithAuthor);

    request$.subscribe({
      next: () => this.router.navigate(['/blog']),
      error: (error) => console.error('Error saving article:', error),
    });
  }
}
