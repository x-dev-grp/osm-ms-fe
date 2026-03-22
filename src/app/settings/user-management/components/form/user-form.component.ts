import { AfterViewInit, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EMPTY, Observable } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from 'src/app/shared/shared.module';
import { UserService } from '../../services/user.service';
import { AdvancedSearchService } from 'src/app/shared/services/advanced-serach.service';
import { SearchResponse } from 'src/app/shared/models/advanced-search/searchResponse';
import { SearchData } from 'src/app/shared/models/advanced-search/searchData';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';
import { OptionsScrollDirective } from '../../../../shared/directives/options-scroll.directive';
import { User } from 'src/app/theme/types/user';

@Component({
  selector: 'user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: true,
  imports: [CommonModule, SharedModule, OptionsScrollDirective]
})
export class UserFormComponent implements OnInit, AfterViewInit {
  readonly destroyRef = inject(DestroyRef);
  readonly fb = inject(FormBuilder);
  readonly userService = inject(UserService);
  readonly searchService = inject(AdvancedSearchService);
  readonly router = inject(Router);
  readonly activatedRoute = inject(ActivatedRoute);
  readonly snackBar = inject(MatSnackBar);

  userForm!: FormGroup;
  roles: any[] = [];

  updateMode = false;
  viewMode = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  user!: User | undefined;

  roleCriteria: SearchData = {
    filterTenant: false,
    searchData: {
      operation: SearchOperation.AND,
      searchs: [],
      search: {
        isDeleted: {
          equalValue: false
        }
      }
    }
  };

  ngOnInit(): void {
    this.initForm();
    this.listenConfirmationMethodChanges();
    this.fetchRoles(false).pipe(take(1)).subscribe();
    this.getRoutingData();
  }

  ngAfterViewInit(): void {
    this.userForm
      .get('role')
      ?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter((value: any) => typeof value === 'string'),
      switchMap((value: string) => {
        this.roleCriteria = {
          ...this.roleCriteria,
          searchData: {
            ...this.roleCriteria.searchData,
            search: {
              ...this.roleCriteria.searchData?.search,
              roleName: {
                likeValue: value
              }
            }
          }
        };

        return this.fetchRoles(false);
      })
    )
      .subscribe();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: [null],
      lastName: [null],
      username: [null, Validators.required],
      email: [null],
      phoneNumber: [null],
      confirmationMethod: ['EMAIL', Validators.required],
      role: [null, Validators.required],
      locked: [false]
    });

    this.applyConfirmationValidators('EMAIL');
  }

  /**
   * Ici on garde la logique de validation dynamique :
   * - EMAIL => email obligatoire
   * - PHONE => phone obligatoire
   */
  private listenConfirmationMethodChanges(): void {
    this.userForm
      .get('confirmationMethod')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        this.applyConfirmationValidators(method);
      });
  }

  private applyConfirmationValidators(method: string): void {
    const emailCtrl = this.userForm.get('email');
    const phoneCtrl = this.userForm.get('phoneNumber');

    if (!emailCtrl || !phoneCtrl) {
      return;
    }

    emailCtrl.clearValidators();
    phoneCtrl.clearValidators();

    if (method === 'EMAIL') {
      emailCtrl.setValidators([Validators.required, Validators.email]);
      phoneCtrl.setValidators([Validators.pattern(/^\+?\d{8,15}$/)]);
    } else {
      emailCtrl.setValidators([Validators.email]);
      phoneCtrl.setValidators([Validators.required, Validators.pattern(/^\+?\d{8,15}$/)]);
    }

    emailCtrl.updateValueAndValidity({ emitEvent: false });
    phoneCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private getRoutingData(): void {
    this.activatedRoute.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.viewMode = !!data?.viewMode;
        this.updateMode = !!data?.updateMode;

        if (data?.user?.data) {
          this.user = data.user.data;
          // @ts-ignore
          this.userForm.patchValue(this.user);
        }

        if (this.viewMode) {
          this.userForm.disable();
        }
      });
  }

  fetchRoles(scroll: boolean): Observable<SearchResponse> {
    const url = 'security/role';

    if (!scroll) {
      this.roleCriteria.page = 0;
    }

    return this.searchService.search(this.roleCriteria, url).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response: SearchResponse) => {
        const filteredData = (response.data || []).filter(
          (role: any) => !['OSMADMIN', 'OSMUSER'].includes(role.roleName)
        );

        this.roles = scroll ? [...this.roles, ...filteredData] : filteredData;
      }),
      catchError((err) => {
        console.error('Autocomplete fetch failed:', err);
        return EMPTY;
      })
    );
  }

  /**
   * Flux principal :
   * - update mode => update user
   * - create mode EMAIL => registerWithOtp
   * - create mode PHONE => addUser (si tu gardes ce scénario)
   */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    if (this.updateMode) {
      this.updateUser();
      return;
    }

    const confirmationMethod = this.userForm.get('confirmationMethod')?.value;

    if (confirmationMethod === 'EMAIL') {
      this.registerWithOtp();
    } else {
      this.addUser();
    }
  }

  private buildPayload(): any {
    const raw = this.userForm.getRawValue();

    return {
      firstName: raw.firstName,
      lastName: raw.lastName,
      username: raw.username,
      email: raw.email,
      phoneNumber: raw.phoneNumber,
      confirmationMethod: raw.confirmationMethod,
      role: raw.role,
      locked: raw.locked
    };
  }

  /**
   * Nouveau flux admin.
   * L’admin ne saisit ni OTP ni mot de passe.
   */
  private registerWithOtp(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const raw = this.userForm.getRawValue();

    const payload = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      username: raw.username,
      email: raw.email,
      confirmationMethod: 'EMAIL',
      role: raw.role,
      locked: false
    };

    this.userService
      .registerWithOtp(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message: string) => {
          this.loading = false;
          this.successMessage =
            message || 'Utilisateur créé. Un email d’activation a été envoyé.';

          this.snackBar.open(this.successMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });

          // reset léger après création
          this.userForm.reset({
            firstName: null,
            lastName: null,
            username: null,
            email: null,
            phoneNumber: null,
            confirmationMethod: 'EMAIL',
            role: null,
            locked: false
          });

          this.applyConfirmationValidators('EMAIL');
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = this.extractErrorMessage(err);

          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Ancien flux éventuel si tu veux garder le cas PHONE ou autre.
   */
  private addUser(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService
      .addUser(this.buildPayload())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Utilisateur créé avec succès';

          this.snackBar.open(this.successMessage, 'Fermer', {
            duration: 3000
          });

          this.router.navigate(['/settings/users/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = this.extractErrorMessage(err);

          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  private updateUser(): void {
    if (!this.user?.id) {
      this.snackBar.open('Identifiant utilisateur introuvable', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService
      .updateUser(this.buildPayload(), this.user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Utilisateur mis à jour avec succès';

          this.snackBar.open(this.successMessage, 'Fermer', {
            duration: 3000
          });

          this.router.navigate(['/settings/users/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = this.extractErrorMessage(err);

          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  scroll(_: any): void {
    this.roleCriteria.page = (this.roleCriteria.page || 0) + 1;
    this.fetchRoles(true).pipe(take(1)).subscribe();
  }

  displayWith = (option: any): string => option?.roleName || '';

  cancel(): void {
    this.router.navigate(['/settings/users/dashboard']);
  }

  private extractErrorMessage(err: any): string {
    if ([504, 503].includes(err?.status)) {
      return 'Service indisponible, réessayez plus tard';
    }

    if (err?.status === 500) {
      return 'Erreur interne du serveur';
    }

    return err?.error || 'Une erreur est survenue';
  }
}
