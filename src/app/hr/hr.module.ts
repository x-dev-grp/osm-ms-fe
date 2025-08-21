import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { HrRoutingModule } from './hr-routing.module';
import { EmployeeComponent } from './components/employee/employee.component';
import {DepartmentComponent} from "./components/department/department.component";
import {EmployeeAddComponent} from "./components/employee-add/employee-add.component";
import {EmployeeDetailComponent} from "./components/employee-detail/employee-detail.component";

@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HrRoutingModule, SharedModule,EmployeeComponent,DepartmentComponent,EmployeeAddComponent,EmployeeDetailComponent],
})
export class HrModule {}
