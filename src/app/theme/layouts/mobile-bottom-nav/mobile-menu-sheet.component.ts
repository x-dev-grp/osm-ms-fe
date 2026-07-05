import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { Navigation } from '../../types/navigation';
import { MobileModuleMenuComponent } from './mobile-module-menu.component';

export interface MobileMenuSheetData {
  menus: Navigation[];
  titleKey?: string;
}

@Component({
  selector: 'app-mobile-menu-sheet',
  standalone: true,
  imports: [MobileModuleMenuComponent, TranslateModule, SharedModule],
  templateUrl: './mobile-menu-sheet.component.html',
  styleUrl: './mobile-menu-sheet.component.scss'
})
export class MobileMenuSheetComponent {
  private readonly sheetRef = inject(MatBottomSheetRef<MobileMenuSheetComponent>);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = inject<MobileMenuSheetData>(MAT_BOTTOM_SHEET_DATA);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.sheetRef.dismiss());
  }

  close(): void {
    this.sheetRef.dismiss();
  }
}
