// Angular import
import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

// project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuItemVerticalComponent } from '../menu-item/menu-item.component';
import { NavigationActiveService } from 'src/app/theme/services/navigation-active.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-menu-collapse',
  imports: [TranslateModule, SharedModule, RouterModule, MenuItemVerticalComponent, CommonModule],
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
  private readonly router = inject(Router);

  // public props
  isEnabled: boolean = false;
  private readonly isExpandedState = signal(false);

  readonly isOpen = computed(() => {
    this.navigationActiveService.currentUrl();
    this.navigationActiveService.activeMenuUrl();
    return this.isExpandedState() || this.hasActiveChild() || this.isSelfActive();
  });

  // all Version Get Item(Component Name Take)
  readonly item = input<NavigationItem>();
  readonly parentRole = input<string[]>();

  constructor() {
    effect(() => {
      this.navigationActiveService.currentUrl();
      this.navigationActiveService.activeMenuUrl();
      if (this.hasActiveChild()) {
        this.isExpandedState.set(true);
      }
    });
  }

  // public method
  ngOnInit() {
    const item = this.item();
    this.isEnabled = item?.disabled ? false : true;
    if (this.hasActiveChild()) {
      this.isExpandedState.set(true);
    }
  }

  hasActiveChild(): boolean {
    return (this.item()?.children ?? []).some((child) => this.navigationActiveService.isItemActive(child));
  }

  isSelfActive(): boolean {
    return this.navigationActiveService.isItemActive(this.item());
  }

  // Expand/collapse submenu; navigate when the collapse item defines a list url.
  navCollapse(e: MouseEvent) {
    e.stopPropagation();

    if (!this.isEnabled) {
      return;
    }

    const item = this.item();
    if (item?.url) {
      void this.router.navigateByUrl(item.url);
      this.isExpandedState.set(true);
      return;
    }

    if (this.hasActiveChild()) {
      return;
    }

    this.isExpandedState.update((open) => !open);
  }
}
