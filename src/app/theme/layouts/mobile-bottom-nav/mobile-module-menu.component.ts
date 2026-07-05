import { Component, inject, input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { Navigation, NavigationItem } from '../../types/navigation';
import { NavigationActiveService } from '../../services/navigation-active.service';

export interface MobileMenuSection {
  id: string;
  title: string;
  icon?: string;
  items: MobileMenuLink[];
}

export interface MobileMenuLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-mobile-module-menu',
  standalone: true,
  imports: [SharedModule, TranslateModule, RouterModule],
  templateUrl: './mobile-module-menu.component.html',
  styleUrl: './mobile-module-menu.component.scss'
})
export class MobileModuleMenuComponent implements OnInit {
  readonly menus = input.required<Navigation[]>();

  private readonly router = inject(Router);
  readonly navigationActiveService = inject(NavigationActiveService);

  sections: MobileMenuSection[] = [];

  ngOnInit(): void {
    this.sections = this.buildSections(this.menus());
    this.navigationActiveService.setMenuItems(this.menus());
  }

  isActive(url?: string): boolean {
    return this.navigationActiveService.isRouteActive(url);
  }

  navigate(url: string): void {
    void this.router.navigateByUrl(url);
  }

  private buildSections(menus: Navigation[]): MobileMenuSection[] {
    const sections: MobileMenuSection[] = [];

    for (const menu of menus) {
      if (menu.hidden || menu.type !== 'group') {
        continue;
      }

      sections.push(...this.buildGroupSections(menu));
    }

    return sections.filter((section) => section.items.length > 0);
  }

  private buildGroupSections(group: Navigation): MobileMenuSection[] {
    const sections: MobileMenuSection[] = [];
    const directItems: MobileMenuLink[] = [];

    for (const child of group.children ?? []) {
      if (child.hidden || child.disabled) {
        continue;
      }

      if (child.type === 'item' && child.url) {
        directItems.push(this.toLink(child));
        continue;
      }

      if (child.type === 'collapse') {
        const nestedItems = this.collectNestedLinks(child.children ?? []);
        if (nestedItems.length) {
          sections.push({
            id: child.id,
            title: child.title,
            icon: child.icon,
            items: nestedItems
          });
        }
      }
    }

    if (directItems.length) {
      sections.unshift({
        id: `${group.id}-main`,
        title: group.title,
        icon: group.icon,
        items: directItems
      });
    }

    return sections;
  }

  private collectNestedLinks(nodes: NavigationItem[]): MobileMenuLink[] {
    const links: MobileMenuLink[] = [];

    for (const node of nodes) {
      if (node.hidden || node.disabled) {
        continue;
      }

      if (node.type === 'item' && node.url) {
        links.push(this.toLink(node));
        continue;
      }

      if (node.type === 'collapse') {
        links.push(...this.collectNestedLinks(node.children ?? []));
      }
    }

    return links;
  }

  private toLink(node: NavigationItem): MobileMenuLink {
    return {
      id: node.id,
      title: node.title,
      url: node.url!,
      icon: node.icon
    };
  }
}
