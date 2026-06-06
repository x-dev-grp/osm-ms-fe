// Angular import
import { Component, OnInit, effect, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

// project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuItemVerticalComponent } from '../menu-item/menu-item.component';
import { NavigationActiveService } from 'src/app/theme/services/navigation-active.service';

@Component({
  selector: 'app-menu-collapse',
  imports: [SharedModule, RouterModule, MenuItemVerticalComponent, CommonModule],
  templateUrl: './menu-collapse.component.html',
  styleUrls: ['./menu-collapse.component.scss'],
  standalone: true,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', display: 'block' }),
        animate('250ms ease-in', style({ transform: 'translateY(0%)' }))
      ]),
      transition(':leave', [animate('250ms ease-in', style({ transform: 'translateY(-100%)' }))])
    ])
  ]
})
export class MenuCollapseComponent implements OnInit {
  readonly navigationActiveService = inject(NavigationActiveService);

  // public props
  isEnabled: boolean = false;
  isExpanded: boolean = false;

  // all Version Get Item(Component Name Take)
  readonly item = input<NavigationItem>();
  readonly parentRole = input<string[]>();

  constructor() {
    effect(() => {
      if (this.hasActiveChild()) {
        this.isExpanded = true;
      }
    });
  }

  // public method
  ngOnInit() {
    const item = this.item();
    this.isEnabled = item?.disabled ? false : true;
    this.isExpanded = this.hasActiveChild();
  }

  hasActiveChild(): boolean {
    return (this.item()?.children ?? []).some((child) => this.navigationActiveService.isItemActive(child));
  }

  isActive(): boolean {
    return this.navigationActiveService.isItemActive(this.item());
  }

  isOpen(): boolean {
    return this.isExpanded || this.hasActiveChild();
  }

  // Method to handle the collapse of the navigation menu
  navCollapse(e: MouseEvent) {
    e.stopPropagation();

    if (!this.isEnabled || this.hasActiveChild()) {
      return;
    }

    this.isExpanded = !this.isExpanded;
  }
}
