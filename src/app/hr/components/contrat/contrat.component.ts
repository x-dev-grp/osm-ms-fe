import { Component, OnInit } from '@angular/core';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { dashboardConfig } from './contrat-dashboard.config';
import { Router } from '@angular/router';
import { Department } from '../../model/department.model';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [OsmDashboard],
  templateUrl: './contrat.component.html',
  styleUrls: ['./contrat.component.scss']
})
export class ContratComponent implements OnInit {
  protected readonly dashboardConfig = dashboardConfig;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  handleAction(event: { row: Department; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate([`hr/contract/fetch/${event.row.id}`]);
        break;
      case 'UPDATE':
        this.router.navigate([`hr/contract/${event.row.id}`]);
        break;
    }
  }
}
