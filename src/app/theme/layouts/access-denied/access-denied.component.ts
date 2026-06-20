import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../auth/services/authentication.service';

type PermView = { raw: string; segments: string[] };

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule, MatButton, TranslatePipe],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent {
  // Query params

  // UI state (mini-modal)

  // Vue formatée des permissions
  authenticationService = inject(AuthenticationService);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  goHome(): void {
    this.router.navigateByUrl('/');
  }
  logout() {
    this.authenticationService.logout();
  }
}
