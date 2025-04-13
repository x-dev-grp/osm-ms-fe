// angular import
import { Component } from '@angular/core';

// project import
import { componentMenus } from 'src/app/demo/data/component';
import { ComponentNavigationComponent } from '../../../@theme/components/navigation/navigation.component';
import { osm_menus } from '../../../shared/osm_menu';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
  imports: [ComponentNavigationComponent]
})
export class ComponentComponent {
  menus = componentMenus;
  protected readonly osm_menus = osm_menus;
}
