import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { HrRoutingModule } from './hr-routing.module';
import { EmployeeComponent } from './components/employee/employee.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HrRoutingModule, SharedModule,EmployeeComponent]
})
export class HrModule {}
