import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

type PermView = { raw: string; segments: string[] };

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButton, TranslatePipe],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent {
  // Query params

  // UI state (mini-modal)

  // Vue formatée des permissions

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  goHome(): void {
    this.router.navigateByUrl('/');
  }
}
