import { Component, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, of, switchMap, throwError } from 'rxjs';
import { ArticleService } from '../../../core/api/services/article.service';
import { SpinnerComponent } from '../../../common/components/spinner/spinner';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-details',
  imports: [SpinnerComponent, DatePipe, RouterLink],
  templateUrl: './details.html',
  styleUrl: './details.scss',
})
export default class ArticleDetailsComponent {
  private readonly articleService = inject(ArticleService);
  private router = inject(Router);

  isDeleting = signal(false);

  articleId = toSignal<number>(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => (id ? of(+id) : throwError(() => 'id cannot be undefined')))
    ) as Observable<number>
  );

  article = rxResource({
    params: () => ({
      id: this.articleId(),
    }),
    stream: ({ params: { id } }) => this.articleService.get(id!),
  });

  onDelete() {
    const articleId = this.articleId();
    if (!articleId || this.isDeleting()) return;

    if (confirm('Are you sure you want to delete this article?')) {
      this.isDeleting.set(true);

      this.articleService.delete(articleId).subscribe({
        next: () => {
          this.router.navigate(['/blog']);
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          this.isDeleting.set(false);
        },
      });
    }
  }
}
