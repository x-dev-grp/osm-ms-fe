// angular import
import { Component } from '@angular/core';

// project import
import { ComponentNavigationComponent } from '../../components/navigation/navigation.component';
import { oosm_menus } from '../../../shared/oosm_menu';

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
  standalone: true,
  imports: [ComponentNavigationComponent]
})
export class ComponentComponent {
  protected readonly oosm_menus = oosm_menus;
}
