// angular import
import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { ThemeLayoutService } from 'src/app/@theme/services/theme-layout.service';

@Component({
  selector: 'app-customer-details-edit',
  imports: [CommonModule, SharedModule],
  templateUrl: './customer-details-edit.component.html',
  styleUrls: ['./customer-details-edit.component.scss']
})
export class CustomerDetailsEditComponent {
  dialogRef = inject<MatDialogRef<CustomerDetailsEditComponent>>(MatDialogRef);
  private themeService = inject(ThemeLayoutService);

  // public props
  direction = 'ltr';

  // constructor
  constructor() {
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  //private method
  private isRtlTheme(direction: string) {
    this.direction = direction;
  }
}
