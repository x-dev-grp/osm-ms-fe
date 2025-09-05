import { Component, OnInit } from '@angular/core';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { dashboardConfig } from './poste-dashboard.config';
import { Router } from '@angular/router';
import { Poste } from '../../model/poste.model';

@Component({
  selector: 'app-poste',
  imports: [OsmDashboard],
  templateUrl: './poste.component.html',
  standalone: true,
  styleUrl: './poste.component.scss'
})
export class PosteComponent implements OnInit {
  protected readonly dashboardConfig = dashboardConfig;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  handleAction(event: { row: Poste; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate([`hr/poste/fetch/${event.row.id}`]);
        break;
      case 'UPDATE':
        this.router.navigate([`hr/poste/${event.row.id}`]);
        break;

    }
  }
}
