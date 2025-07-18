import { Component, DestroyRef, inject } from '@angular/core';
import { CardComponent } from '../../@theme/components/card/card.component';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { NgIf } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { SharedModule } from '../../demo/shared/shared.module';
import { UserService } from '../../settings/user-management/services/user.service';
import { AdvancedSearchService } from '../../shared/services/advanced-serach.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchData } from '../../shared/models/advanced-search/searchData';
import { User } from '../../@theme/types/user';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, filter, Observable, of, switchMap, tap } from 'rxjs';
import { SearchResponse } from '../../shared/models/advanced-search/searchResponse';
import { AddCompanyUserService } from '../../shared/services/add-company-user.service';
import { CompanyUserDto } from '../../shared/models/company-user-dto';

@Component({
  selector: 'app-add-company-user',
  standalone: true,
  imports: [
    CardComponent,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatOption,
    MatProgressSpinner,
    MatSelect,
    MatSlideToggle,
    NgIf,
    ReactiveFormsModule,
    SharedModule
  ],
  templateUrl: './add-company-user.component.html',
  styleUrls: ['./add-company-user.component.scss']
})
export class AddCompanyUserComponent {
  readonly destroyRef = inject(DestroyRef);
  userForm: FormGroup;
  _fb = inject(FormBuilder);
  _userService = inject(UserService);
  _searchService = inject(AdvancedSearchService);
  _router = inject(Router);
  _activatedRoute = inject(ActivatedRoute);
  _addCompanyUserService = inject(AddCompanyUserService);
  roles: any[];
  updateMode: boolean = false;
  viewMode: boolean = false;
  roleCriteria: SearchData = new SearchData();
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
        companyName: [null, Validators.required],
        firstName: [null],
        lastName: [null],
        username: [null, Validators.required],
        email: [null, [Validators.email]],
        phoneNumber: [null, [Validators.pattern(/^ ?\d{8,12}$/)]],
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
      if (data?.user?.data?.length) {
        this.user = data?.user?.data[0];
        this.userForm.patchValue(this.user);
      }
    });
  }

  fetchRoles(scroll: boolean): Observable<SearchResponse> {
    const url = 'security/role';

    if (!scroll) {
      this.roleCriteria.page = 0;
    }
    return this._searchService.search(this.roleCriteria, url).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response: SearchResponse) => {
        this.roles = scroll ? [...this.roles, ...response.data] : response.data;
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
    const dto: CompanyUserDto = {
      legalName: this.userForm.value.companyName,
      user: {...this.userForm.value}
    };
    this._addCompanyUserService
      .addCompanyWithUser(dto)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.errorMessage = '';
          this.loading = false;
          this._router.navigate(['/administration/dashboard/']);
        }),
        catchError((err: any) => {
          console.log(err);
          if ([504, 503].includes(err?.status)) {
            this.errorMessage = 'Service unavailable please try again later';
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
    this._router.navigate(['/administration/dashboard/']);
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
}
