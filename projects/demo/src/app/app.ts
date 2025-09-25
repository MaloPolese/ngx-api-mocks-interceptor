import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: `
  :host {
    width: 100%;
  }
  `,
})
export class App {}
