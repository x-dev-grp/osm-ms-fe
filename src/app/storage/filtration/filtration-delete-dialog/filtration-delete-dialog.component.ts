import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import {MatButton} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatIcon} from "@angular/material/icon";
import {DatePipe, NgClass} from "@angular/common";

@Component({
  selector: 'app-filtration-delete-dialog',
  templateUrl: './filtration-delete-dialog.component.html',
  styleUrls: ['./filtration-delete-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    FormsModule,
    MatCheckbox,
    MatIcon,
    NgClass,
    DatePipe
  ]
})
export class FiltrationDeleteDialogComponent {
  constructor(
    private ref: MatDialogRef<FiltrationDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row: FiltrationOperation }
  ) {}

  // Annuler la suppression.
  cancel(): void {
    this.ref.close(false);
  }

  // Confirmer la suppression (la liste appellera l’API).
  confirmed(): void {
    this.ref.close(true);
  }

  protected readonly confirm = confirm;
}
