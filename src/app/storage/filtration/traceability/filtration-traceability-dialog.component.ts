import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-filtration-traceability-dialog',
  templateUrl: './filtration-traceability-dialog.component.html',
  styleUrls: ['./filtration-traceability-dialog.component.scss'],
  standalone: true,
  imports: [TranslateModule, CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule]
})
export class FiltrationTraceabilityDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { operation: FiltrationOperation }) {}
}
