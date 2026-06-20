import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, input } from '@angular/core';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { getUserInitials } from 'src/app/shared/utils/user-initials.util';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  private readonly authService = inject(AuthenticationService);

  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  photoUrl = input<string | null | undefined>(undefined);

  displayPhoto = computed(() => {
    const explicitPhoto = this.photoUrl();
    if (explicitPhoto !== undefined) {
      return explicitPhoto;
    }
    return this.authService.userPhotoPreviewSignal();
  });

  initials = computed(() => getUserInitials(this.authService.currentUserSignal()));
}
