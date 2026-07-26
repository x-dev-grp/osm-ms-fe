import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../../shared/shared.module';
import { DashboardShellComponent } from '../../shared/components/dashboard/dashboard-shell.component';
import { ToastService } from '../../shared/services/toast.service';
import { HrOpsService } from '../services/hr-ops.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-hr-agent',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardShellComponent
  ],
  templateUrl: './hr-agent.component.html',
  styleUrl: './hr-agent.component.scss'
})
export class HrAgentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ops = inject(HrOpsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  sending = false;
  messages: ChatMessage[] = [];

  form = this.fb.group({
    prompt: ['', Validators.required],
    confirmWriteActions: [false]
  });

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const prompt = String(this.form.value.prompt ?? '').trim();
    if (!prompt) {
      return;
    }

    this.messages = [...this.messages, { role: 'user', text: prompt }];
    this.sending = true;
    this.ops
      .queryAgent({
        prompt,
        confirmed: !!this.form.value.confirmWriteActions,
        confirmWriteActions: !!this.form.value.confirmWriteActions
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.sending = false;
          const payload = response?.data;
          const answer =
            payload?.message ||
            payload?.answer ||
            response?.message ||
            '—';
          this.messages = [...this.messages, { role: 'assistant', text: answer }];
          this.form.patchValue({ prompt: '' });
        },
        error: () => {
          this.sending = false;
          this.toast.error('HR.AGENT.SEND_ERROR');
        }
      });
  }
}
