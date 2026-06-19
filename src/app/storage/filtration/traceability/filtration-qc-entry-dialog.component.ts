import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface FiltrationQcDialogData {
  filtrationOperationId: string;
  traceabilityLotId?: string | null;
}

/** @deprecated Use full-page route /storage/oil-filtering/:id/quality */
@Component({
  selector: 'app-filtration-qc-entry-dialog',
  standalone: true,
  template: '',
  imports: [CommonModule]
})
export class FiltrationQcEntryDialogComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: FiltrationQcDialogData,
    private readonly dialogRef: MatDialogRef<FiltrationQcEntryDialogComponent>,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.dialogRef.close(false);
    if (this.data?.filtrationOperationId) {
      void this.router.navigate(['/storage', 'oil-filtering', this.data.filtrationOperationId, 'quality']);
    }
  }
}
