import { Component, OnInit } from '@angular/core';
import { OosmDashboard } from '../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { dashboardConfig } from './department-dashboard.config';
import { Router } from '@angular/router';
import { Department } from '../../model/department.model';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [OosmDashboard],
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent implements OnInit {
  protected readonly dashboardConfig = dashboardConfig;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  handleAction(event: { row: Department; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate([`hr/department/fetch/${event.row.id}`]);
        break;
      case 'UPDATE':
        this.router.navigate([`hr/department/${event.row.id}`]);
        break;
    }
  }
}
