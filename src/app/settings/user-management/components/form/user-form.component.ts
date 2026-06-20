import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { catchError, EMPTY, filter, Observable, of, switchMap, tap } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AdvancedSearchService } from 'src/app/shared/services/advanced-serach.service';
import { SearchResponse } from 'src/app/shared/models/advanced-search/searchResponse';
import { SearchData } from 'src/app/shared/models/advanced-search/searchData';
import { User } from 'src/app/theme/types/user';
import { OptionsScrollDirective } from '../../../../shared/directives/options-scroll.directive';
import { SearchOperation } from '../../../../shared/models/advanced-search/searchOperation';

@Component({
  selector: 'user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: true,
  imports: [TranslateModule, CommonModule, SharedModule, OptionsScrollDirective]
})
export class UserFormComponent implements OnInit, AfterViewInit {
  private readonly i18n = inject(TranslateService);
  readonly destroyRef = inject(DestroyRef);
  userForm: FormGroup;
  _fb = inject(FormBuilder);
  _userService = inject(UserService);
  _authService = inject(AuthenticationService);
  _searchService = inject(AdvancedSearchService);
  _router = inject(Router);
  _activatedRoute = inject(ActivatedRoute);
  roles: any[];
  updateMode: boolean = false;
  viewMode: boolean = false;
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
  loading: boolean = false;
  errorMessage: string = '';
  user: User;
  constructor() {}
  ngAfterViewInit(): void {
    this.userForm.controls['role'].valueChanges
      .pipe(
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
  ngOnInit() {
    this.fetchRoles(false).subscribe();
    this.userForm = this._fb.group(
      {
        firstName: [null],
        lastName: [null],
        username: [null, Validators.required],
        email: [null, [Validators.email]],
        phoneNumber: [null, [Validators.pattern(/^\+?\d{10,15}$/)]],
        confirmationMethod: ['EMAIL', Validators.required],
        role: [null, Validators.required],
        locked: [false]
      },
      {
        validators: [this.emailOrPhoneRequired()]
      }
    );
    this.userForm
      .get('confirmationMethod')
      ?.valueChanges.pipe(tap((value) => {}))
      .subscribe();
    this.getRoutingData();
  }
  getRoutingData() {
    this._activatedRoute.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      this.viewMode = !!data?.viewMode;
      this.updateMode = !!data?.updateMode;
      if (this.viewMode) this.userForm.disable();
      if (data?.user?.data) {
        this.user = data?.user?.data;
        this.userForm.patchValue(this.user);
      }
    });
  }
  private emailOrPhoneRequired() {
    return (group: AbstractControl): ValidationErrors | null => {
      const methodCtrl = group.get('confirmationMethod')!;
      const emailCtrl = group.get('email')!;
      const phoneCtrl = group.get('phoneNumber')!;

      const method = methodCtrl.value;
      const email = emailCtrl.value;
      const phone = phoneCtrl.value;

      [emailCtrl, phoneCtrl].forEach((ctrl) => {
        if (ctrl.errors?.['emailRequired']) {
          delete ctrl.errors!['emailRequired'];
        }
        if (ctrl.errors?.['phoneRequired']) {
          delete ctrl.errors!['phoneRequired'];
        }
        if (Object.keys(ctrl.errors || {}).length === 0) {
          ctrl.setErrors(null);
        }
      });

      if (!method) {
        return null;
      }

      if (method === 'EMAIL') {
        if (!email) {
          emailCtrl.setErrors({ ...emailCtrl.errors, emailRequired: true });
        }
      } else {
        if (!phone) {
          phoneCtrl.setErrors({ ...phoneCtrl.errors, phoneRequired: true });
        }
      }

      return null;
    };
  }
  fetchRoles(scroll: boolean): Observable<SearchResponse> {
    const url = 'security/role';

    if (!scroll) {
      this.roleCriteria.page = 0;
    }

    return this._searchService.search(this.roleCriteria, url).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response: SearchResponse) => {
        const filteredData = response.data?.filter((role) => !['OSMADMIN', 'OSMUSER'].includes(role.roleName));
        this.roles = scroll ? [...this.roles, ...filteredData] : filteredData;
      }),
      catchError((err) => {
        console.error('Autocomplete fetch failed:', err);
        return EMPTY;
      })
    );
  }
  onSubmit(): void {
    if (!this.userForm.valid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const user = this.userForm.value;
    (!this.updateMode ? this._userService.addUser(user) : this._userService.updateUser(user, this.user?.id))
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response: any) => {
          this.errorMessage = '';
          this.loading = false;
          if (this.updateMode && this.user?.id === this._authService.currentUserValue?.id) {
            this._authService.refreshSessionSilently();
          }
          this._router.navigate(['/settings/users/dashboard']);
        }),
        catchError((err: any) => {
          console.log(err);
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = this.i18n.instant('LOGIN.SERVICE_UNAVAILABLE');
          } else if (err.status == 500) {
            this.errorMessage = this.i18n.instant('AUTO.INTERNAL_SERVER_ERROR');
          } else {
            this.errorMessage = err?.error;
          }
          this.loading = false;
          return of(null);
        })
      )
      .subscribe();
  }
  scroll(event: any) {
    this.roleCriteria.page = this.roleCriteria.page! + 1;
    this.fetchRoles(true).subscribe();
  }
  resetForm(): void {
    this.userForm.reset();
  }
  displayWith = (option: any): string => {
    return option?.roleName;
  };
  cancel() {
    this._router.navigate(['/settings/users/dashboard']);
  }
}
