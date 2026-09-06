import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-qr-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
  template: `
    <section class="qr-panel" [class.qr-panel--compact]="compact" [class.qr-panel--empty]="!hasImage()">
      @if (hasImage()) {
        <div class="qr-panel__media">
          <img [src]="'data:image/png;base64,' + qrImageBase64" [alt]="'QR.TITLE' | translate" />
        </div>
      } @else {
        <div class="qr-panel__placeholder" aria-hidden="true">
          <mat-icon>qr_code_2</mat-icon>
        </div>
      }

      <div class="qr-panel__meta">
        <span class="qr-panel__label">{{ 'AUTO.QR' | translate }}</span>

        @if (hasCode()) {
          <code class="qr-panel__code">{{ publicCode }}</code>
        } @else {
          <span class="qr-panel__hint">—</span>
        }

        <div class="qr-panel__actions">
          <button
            mat-button
            type="button"
            class="qr-panel__btn"
            [disabled]="generating"
            [matTooltip]="generateLabelKey() | translate"
            (click)="generate.emit()"
          >
            <mat-icon>{{ hasImage() ? 'refresh' : 'add' }}</mat-icon>
            <span>{{ generating ? '...' : (generateLabelKey() | translate) }}</span>
          </button>

          @if (hasImage()) {
            <button
              mat-icon-button
              type="button"
              class="qr-panel__icon-btn"
              [matTooltip]="'COMMON.PRINT' | translate"
              (click)="print()"
            >
              <mat-icon>print</mat-icon>
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .qr-panel {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.85rem;
        align-items: center;
        width: max-content;
        max-width: 100%;
        padding: 0.65rem 0.75rem;
        border-radius: 14px;
        background: linear-gradient(180deg, #fafbfc 0%, #f3f5f7 100%);
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: none;
      }

      .qr-panel--empty {
        background: #f8fafc;
      }

      .qr-panel--compact {
        padding: 0.45rem 0.55rem;
        gap: 0.65rem;
        border-radius: 12px;
      }

      .qr-panel__media,
      .qr-panel__placeholder {
        display: grid;
        place-items: center;
        width: 88px;
        height: 88px;
        border-radius: 10px;
        background: #fff;
        border: 1px solid rgba(15, 23, 42, 0.06);
      }

      .qr-panel--compact .qr-panel__media,
      .qr-panel--compact .qr-panel__placeholder {
        width: 64px;
        height: 64px;
        border-radius: 8px;
      }

      .qr-panel__media img {
        width: 76px;
        height: 76px;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .qr-panel--compact .qr-panel__media img {
        width: 52px;
        height: 52px;
      }

      .qr-panel__placeholder mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #94a3b8;
      }

      .qr-panel__meta {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }

      .qr-panel__label {
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748b;
      }

      .qr-panel__code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
        background: transparent;
        padding: 0;
        word-break: break-all;
      }

      .qr-panel__hint {
        font-size: 0.82rem;
        color: #94a3b8;
      }

      .qr-panel__actions {
        display: flex;
        align-items: center;
        gap: 0.15rem;
        margin-top: 0.15rem;
      }

      .qr-panel__btn {
        min-width: 0;
        padding: 0 0.35rem;
        line-height: 1.8;
        font-size: 0.78rem;
        color: #334155;
      }

      .qr-panel__btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 0.2rem;
      }

      .qr-panel__icon-btn {
        width: 30px;
        height: 30px;
        padding: 0;
        color: #64748b;
      }

      .qr-panel__icon-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      @media (max-width: 600px) {
        .qr-panel {
          width: 100%;
        }
      }
    `
  ]
})
export class QrPanelComponent {
  @Input() publicCode: string | null | undefined;
  @Input() qrImageBase64: string | null | undefined;
  @Input() qrUrl: string | null | undefined;
  @Input() payloadType = '';
  @Input() generating = false;
  @Input() compact = false;

  @Output() generate = new EventEmitter<void>();

  hasCode(): boolean {
    return !!this.publicCode?.trim();
  }

  hasImage(): boolean {
    return !!this.qrImageBase64?.trim();
  }

  generateLabelKey(): string {
    return this.hasImage() ? 'AUTO.REGENERATE' : 'AUTO.GENERER_QR';
  }

  print(): void {
    if (!this.hasImage()) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; color: #111; }
            img { width: 280px; height: 280px; }
            .code { margin-top: 12px; font-family: ui-monospace, monospace; font-size: 18px; letter-spacing: 0.04em; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <img src="data:image/png;base64,${this.qrImageBase64}" alt="QR Code" />
          ${this.publicCode ? `<div class="code">${this.publicCode}</div>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
