/* confirm-dialog.component.ts */
import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslateModule, MatDialogContent, MatDialogActions, MatButton, MatDialogTitle],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private ref: MatDialogRef<ConfirmDialogComponent>
  ) {
  }

  ok() {
    this.ref.close(true);
  }

  cancel() {
    this.ref.close(false);
  }
}
