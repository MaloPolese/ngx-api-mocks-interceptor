import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `<div class="spinner"></div>`,
  styles: [
    `
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-paper-120);
        border-radius: 50%;
        border-top-color: var(--color-primary-500);
        animation: spin 1s ease-in-out infinite;
        margin: 2rem auto;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {}
