import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavRightComponent } from './toolbar-right/toolbar-right.component';
import { NavLeftComponent } from './toolbar-left/toolbar-left.component';

@Component({
  selector: 'app-nav-bar',
  imports: [SharedModule, NavLeftComponent, NavRightComponent, CommonModule],
  templateUrl: './toolbar.component.html',
  standalone: true,
  styleUrls: ['./toolbar.component.scss']
})
export class NavBarComponent {}
