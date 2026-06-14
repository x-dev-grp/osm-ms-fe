// Angular import
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuCollapseComponent } from '../menu-collapse/menu-collapse.component';
import { MenuItemVerticalComponent } from '../menu-item/menu-item.component';

@Component({
  selector: 'app-menu-group-vertical',
  imports: [CommonModule, SharedModule, MenuCollapseComponent, MenuItemVerticalComponent],
  templateUrl: './menu-group.component.html',
  standalone: true,
  styleUrls: ['./menu-group.component.scss']
})
export class MenuGroupVerticalComponent {
  readonly item = input.required<NavigationItem>();
}
