// angular import
import { Component } from '@angular/core';

// project import
 import { ComponentNavigationComponent } from '../../../@theme/components/navigation/navigation.component';
import { osm_menus } from '../../../shared/osm_menu';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
  standalone: true,
  imports: [ComponentNavigationComponent]
})
export class ComponentComponent {
  protected readonly osm_menus = osm_menus;
}
