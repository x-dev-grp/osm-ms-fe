// angular import
import { Component, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MailData } from 'src/app/fake-data/mail';
import { ThemeLayoutService } from 'src/app/@theme/services/theme-layout.service';

export interface PeriodicElement {
  images: string;
  name: string;
  text: string;
  symbol: string;
  date: string;
  promo: string;
  forums: string;
}

const ELEMENT_DATA: PeriodicElement[] = MailData;

@Component({
  selector: 'app-mail-content',
  imports: [CommonModule, SharedModule],
  templateUrl: './mail-content.component.html',
  styleUrls: ['./mail-content.component.scss']
})
export class MailContentComponent {
  private themeService = inject(ThemeLayoutService);

  // public props
  titleContent = true;
  detailsContent = false;
  readonly star = input(false);
  readonly unStar = input(true);
  readonly unImportant = input(true);
  readonly important = input(false);
  readonly paperClip = input(true);
  readonly promotion = input(false);
  readonly forums = input(false);
  readonly common = input(true);
  direction = 'ltr';

  displayedColumns: string[] = ['select', 'name', 'text', 'symbol', 'date'];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);
  selection = new SelectionModel<PeriodicElement>(true, []);

  // constructor
  constructor() {
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  // private methods
  private isRtlTheme(direction: string) {
    this.direction = direction;
  }

  // public method
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: PeriodicElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'}`;
  }

  detailsContentShow() {
    this.titleContent = !this.titleContent;
    this.detailsContent = !this.detailsContent;
  }

  backToMail() {
    this.detailsContent = false;
    this.titleContent = true;
  }
}
