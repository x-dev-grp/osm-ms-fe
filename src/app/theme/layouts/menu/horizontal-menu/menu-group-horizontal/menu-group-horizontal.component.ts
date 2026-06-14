import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationItem } from 'src/app/theme/types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuCollapseComponent } from '../../vertical-menu/menu-collapse/menu-collapse.component';
import { MenuItemVerticalComponent } from '../../vertical-menu/menu-item/menu-item.component';

@Component({
  selector: 'app-menu-group-horizontal',
  imports: [CommonModule, SharedModule, MenuCollapseComponent, MenuItemVerticalComponent],
  templateUrl: './menu-group-horizontal.component.html',
  standalone: true
})
export class MenuGroupHorizontalComponent {
  readonly item = input.required<NavigationItem>();
}
