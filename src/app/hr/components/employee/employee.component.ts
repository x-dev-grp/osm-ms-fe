import { Component, OnInit } from '@angular/core';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { dashboardConfig } from './Employee-dashboard.config';
import { Router } from '@angular/router';
import { Employee } from '../../model/employee-model';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-employee',
  imports: [TranslateModule, OsmDashboard, MatCard, MatCardContent, MatIcon],
  templateUrl: './employee.component.html',
  standalone: true,
  styleUrl: './employee.component.scss'
})
export class EmployeeComponent implements OnInit {
  protected readonly dashboardConfig = dashboardConfig;
  pointCount: number;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  handleAction(event: { row: Employee; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate([`hr/employee/fetch/${event.row.id}`]);
        break;
      case 'UPDATE':
        this.router.navigate([`hr/employee/${event.row.id}`]);
        break;
      case 'POINTAGE':
        console.log(JSON.stringify(event.row));
        break;
    }
  }

  loadPointage() {
    this.router.navigate(['/hr/pointage']);
  }
}
