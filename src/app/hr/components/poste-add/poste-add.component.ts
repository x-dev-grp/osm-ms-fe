import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PosteService } from '../../services/poste-service';
import { Poste } from '../../model/poste.model';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-poste-add',
  standalone: true,
  templateUrl: './poste-add.component.html',
  styleUrls: ['./poste-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
    CardComponent
  ]
})
export class PosteAddComponent implements OnInit {
  posteForm: FormGroup;
  isEditing = false;
  posteId?: string;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private posteService: PosteService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.posteForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.posteId = id;
      this.loadPoste(this.posteId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      externalId: [''],
    });
  }

  private loadPoste(id: string): void {
    this.loading = true;
    this.posteService.getPoste(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const poste = Array.isArray(response.data) ? response.data[0] : response.data;
          this.posteForm.patchValue({
            name: poste.name,
            description: poste.description || '',
            externalId: poste.externalId,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('POSTE.MESSAGES.ERROR_LOADING'));
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.posteForm.valid) {
      this.loading = true;
      const formValue = this.posteForm.value;

      const posteData: Poste = {
        id: this.posteId,
        name: formValue.name,
        description: formValue.description || '',
        externalId: formValue.externalId,
      };

      if (this.isEditing && this.posteId) {
        this.updatePoste(posteData);
      } else {
        this.addPoste(posteData);
      }
    }
  }

  private addPoste(poste: Poste): void {
    this.posteService.addPoste(poste).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('POSTE.MESSAGES.SAVE_SUCCESS'));
          this.router.navigate(['/hr/poste']);
        } else {
          this.toast.error(response.message || this.translate.instant('POSTE.MESSAGES.ERROR_SAVING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('POSTE.MESSAGES.ERROR_SAVING'));
        this.loading = false;
      }
    });
  }

  private updatePoste(poste: Poste): void {
    this.posteService.updatePoste(poste).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('POSTE.MESSAGES.UPDATE_SUCCESS'));
          this.router.navigate(['/hr/poste']);
        } else {
          this.toast.error(response.message || this.translate.instant('POSTE.MESSAGES.ERROR_UPDATING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('POSTE.MESSAGES.ERROR_UPDATING'));
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/hr/poste']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.posteForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('COMMON.VALIDATION.REQUIRED');
    }
    return '';
  }
}
