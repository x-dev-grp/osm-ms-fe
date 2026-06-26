import { Component, OnInit } from '@angular/core';
import { OosmDashboard } from '../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { dashboardConfig } from './contrat-dashboard.config';
import { Router } from '@angular/router';
import { Department } from '../../model/department.model';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [OosmDashboard],
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
