import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { User } from 'src/app/theme/types/user';
import { UserAvatarComponent } from 'src/app/shared/components/user-avatar/user-avatar.component';
import { buildUserPhotoDataUrl } from 'src/app/shared/utils/user-initials.util';
import { ChangePasswordPayload, UserProfileUpdate, UserService } from '../user-management/services/user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, SharedModule, TranslateModule, UserAvatarComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthenticationService);
  private readonly i18n = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  profile: User | null = null;
  profileLoading = false;
  passwordLoading = false;
  profileError = '';
  profileSuccess = '';
  passwordError = '';
  passwordSuccess = '';
  hideOldPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  photoPreview: string | null = null;
  photoLoading = false;
  photoError = '';
  photoSuccess = '';

  get displayName(): string {
    const profile = this.profile;
    if (!profile) {
      return '';
    }
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    return fullName || profile.username || '';
  }

  get roleLabel(): string {
    const role = this.profile?.role;
    if (!role) {
      return '';
    }
    return typeof role === 'string' ? role : role.roleName || '';
  }

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group(
      {
        firstName: [null],
        lastName: [null],
        email: [null, [Validators.email]],
        phoneNumber: [null, [Validators.pattern(/^\+?\d{10,15}$/)]],
        confirmationMethod: ['EMAIL', Validators.required]
      },
      { validators: [this.emailOrPhoneRequired()] }
    );

    this.passwordForm = this.fb.group(
      {
        oldPassword: [null, Validators.required],
        newPassword: [null, [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
        newPasswordConfirmation: [null, Validators.required]
      },
      { validators: [this.passwordConfirmationMatcher()] }
    );
  }

  loadProfile(): void {
    this.profileLoading = true;
    this.profileError = '';
    this.userService
      .getMyProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((profile) => {
          this.profile = profile;
          this.photoPreview = buildUserPhotoDataUrl(profile.photoData, profile.photoContentType);
          this.authService.setUserPhotoPreview(this.photoPreview);
          this.profileForm.patchValue({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phoneNumber: profile.phoneNumber,
            confirmationMethod: profile.confirmationMethod || 'EMAIL'
          });
          this.profileLoading = false;
        }),
        catchError((err) => {
          this.profileLoading = false;
          this.profileError = this.resolveError(err, 'USER_PROFILE.LOAD_ERROR');
          return of(null);
        })
      )
      .subscribe();
  }

  onPhotoPicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadPhotoFile(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  private uploadPhotoFile(file: File): void {
    const maxBytes = 200 * 1024;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.photoError = this.i18n.instant('USER_PROFILE.PHOTO_FORMAT');
      return;
    }
    if (file.size > maxBytes) {
      this.photoError = this.i18n.instant('USER_PROFILE.PHOTO_TOO_LARGE');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [, base64] = dataUrl.split(',');
      this.persistPhoto(base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  private persistPhoto(photoData: string, photoContentType: string): void {
    this.photoLoading = true;
    this.photoError = '';
    this.photoSuccess = '';

    this.userService
      .uploadMyPhoto({ photoData, photoContentType })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((photo) => {
          this.photoPreview = buildUserPhotoDataUrl(photo.photoData, photo.photoContentType);
          this.authService.setUserPhotoPreview(this.photoPreview);
          if (this.profile) {
            this.profile = {
              ...this.profile,
              photoData: photo.photoData,
              photoContentType: photo.photoContentType
            };
          }
          this.photoLoading = false;
          this.photoSuccess = this.i18n.instant('USER_PROFILE.PHOTO_SUCCESS');
        }),
        catchError((err) => {
          this.photoLoading = false;
          this.photoError = this.resolveError(err, 'USER_PROFILE.PHOTO_ERROR');
          return of(null);
        })
      )
      .subscribe();
  }

  removePhoto(): void {
    this.photoLoading = true;
    this.photoError = '';
    this.photoSuccess = '';

    this.userService
      .removeMyPhoto()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.photoPreview = null;
          this.authService.setUserPhotoPreview(null);
          if (this.profile) {
            this.profile = { ...this.profile, photoData: null, photoContentType: null };
          }
          this.photoLoading = false;
          this.photoSuccess = this.i18n.instant('USER_PROFILE.PHOTO_REMOVE_SUCCESS');
        }),
        catchError((err) => {
          this.photoLoading = false;
          this.photoError = this.resolveError(err, 'USER_PROFILE.PHOTO_ERROR');
          return of(null);
        })
      )
      .subscribe();
  }

  onSaveProfile(): void {
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;
    this.profileError = '';
    this.profileSuccess = '';

    const payload: UserProfileUpdate = this.profileForm.value;
    this.userService
      .updateMyProfile(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((updated) => {
          this.profile = updated;
          this.profileLoading = false;
          this.profileSuccess = this.i18n.instant('USER_PROFILE.SAVE_SUCCESS');
          this.authService.refreshSessionSilently();
        }),
        catchError((err) => {
          this.profileLoading = false;
          this.profileError = this.resolveError(err, 'USER_PROFILE.SAVE_ERROR');
          return of(null);
        })
      )
      .subscribe();
  }

  onChangePassword(): void {
    if (!this.passwordForm.valid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const payload: ChangePasswordPayload = this.passwordForm.value;
    this.userService
      .changeMyPassword(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.passwordLoading = false;
          this.passwordSuccess = this.i18n.instant('USER_PROFILE.PASSWORD_SUCCESS');
          this.passwordForm.reset();
        }),
        catchError((err) => {
          this.passwordLoading = false;
          this.passwordError = this.resolveError(err, 'USER_PROFILE.PASSWORD_ERROR');
          return of(null);
        })
      )
      .subscribe();
  }

  private emailOrPhoneRequired() {
    return (group: AbstractControl): ValidationErrors | null => {
      const methodCtrl = group.get('confirmationMethod')!;
      const emailCtrl = group.get('email')!;
      const phoneCtrl = group.get('phoneNumber')!;
      const method = methodCtrl.value;

      emailCtrl.setErrors(null);
      phoneCtrl.setErrors(null);

      if (method === 'EMAIL') {
        if (!emailCtrl.value) {
          emailCtrl.setErrors({ emailRequired: true });
          return { emailRequired: true };
        }
      } else if (method === 'PHONE') {
        if (!phoneCtrl.value) {
          phoneCtrl.setErrors({ phoneRequired: true });
          return { phoneRequired: true };
        }
      }
      return null;
    };
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value);

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
      ? null
      : { passwordStrength: true };
  }

  private passwordConfirmationMatcher() {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('newPassword')!;
      const confirmPassword = group.get('newPasswordConfirmation');
      const valuePass = password.value;
      const valueConfirm = confirmPassword?.value;

      if (valueConfirm && valuePass !== valueConfirm) {
        confirmPassword?.setErrors({ ...confirmPassword.errors, mismatch: true });
      } else if (confirmPassword?.hasError('mismatch')) {
        confirmPassword.setErrors(confirmPassword.hasError('required') ? { required: true } : null);
      }
      return null;
    };
  }

  private resolveError(err: unknown, fallbackKey: string): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const message = (err as { error?: unknown }).error;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return this.i18n.instant(fallbackKey);
  }
}
