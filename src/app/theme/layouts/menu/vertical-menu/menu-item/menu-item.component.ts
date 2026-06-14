// Angular import
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavigationActiveService } from 'src/app/theme/services/navigation-active.service';

@Component({
  selector: 'app-menu-item',
  imports: [RouterModule, SharedModule, CommonModule],
  templateUrl: './menu-item.component.html',
  standalone: true,
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemVerticalComponent implements OnInit {
  private readonly navigationActiveService = inject(NavigationActiveService);

  // public props
  readonly item = input.required<NavigationItem>();
  readonly parentRole = input<string[]>();

  isEnabled: boolean = false;

  readonly isSelected = computed(() => {
    const item = this.item();
    this.navigationActiveService.currentUrl();
    this.navigationActiveService.activeMenuUrl();
    return this.navigationActiveService.isRouteActive(item.url, item.exactMatch ?? false);
  });

  //life cycle hook
  ngOnInit() {
    const item = this.item();
    this.isEnabled = item?.disabled ? false : true;
  }

  // public method
  // toggleMenu(event: MouseEvent) {
  //   if (window.innerWidth < 1025) {
  //     this.themeService.toggleSideDrawer();
  //   }
  //
  //   const ele = event.target as HTMLElement;
  //   if (ele !== null && ele !== undefined) {
  //     const parent = ele.parentElement as HTMLElement;
  //     const up_parent = ((parent.parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
  //     const last_parent = (up_parent.parentElement as HTMLElement).parentElement as HTMLElement;
  //     if (last_parent.classList.contains('coded-submenu')) {
  //       up_parent.classList.remove('coded-trigger');
  //       up_parent.classList.remove('active');
  //     } else {
  //       const sections = document.querySelectorAll('.coded-hasmenu');
  //       for (let i = 0; i < sections.length; i++) {
  //         sections[i].classList.remove('active');
  //         sections[i].classList.remove('coded-trigger');
  //       }
  //     }
  //
  //     if (parent.classList.contains('coded-hasmenu')) {
  //       parent.classList.add('coded-trigger');
  //       parent.classList.add('active');
  //     } else if (up_parent.classList.contains('coded-hasmenu')) {
  //       up_parent.classList.add('coded-trigger');
  //       up_parent.classList.add('active');
  //     } else if (last_parent.classList.contains('coded-hasmenu')) {
  //       last_parent.classList.add('coded-trigger');
  //       last_parent.classList.add('active');
  //     }
  //   }
  // }
  toggleMenu(ev: MouseEvent) {
    ev?.stopPropagation();
    if (!this.isEnabled) {
      ev?.preventDefault();
      return;
    }
    // Do NOT trigger any global collapse here when routing.
    // Let the Router navigate; the group should stay open.
  }
}
