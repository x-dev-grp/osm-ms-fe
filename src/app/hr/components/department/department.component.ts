import { Component, OnInit } from '@angular/core';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { dashboardConfig } from './department-dashboard.config';
import { Router } from '@angular/router';
import { Department } from '../../model/department.model';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [OsmDashboard],
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
        console.log('View Department:', JSON.stringify(event.row));
        break;

      case 'UPDATE':
        console.log('Update Department:', JSON.stringify(event.row));
        break;
    }
  }
}
