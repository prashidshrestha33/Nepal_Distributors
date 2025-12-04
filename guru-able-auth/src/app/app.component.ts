import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
    selector: 'app-root',
    template: `<router-outlet></router-outlet>`,
    standalone: false
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
