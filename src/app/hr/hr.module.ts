import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { HrRoutingModule } from './hr-routing.module';
import { EmployeeComponent } from './components/employee/employee.component';
import {DepartmentComponent} from "./components/department/department.component";
import {EmployeeAddComponent} from "./components/employee/employee-add/employee-add.component";
import {EmployeeDetailComponent} from "./components/employee/employee-detail/employee-detail.component";
import {DepartmentAddComponent} from "./components/department/department-add/department-add.component";
import {ContratComponent} from "./components/contrat/contrat.component";
import {ContractAddComponent} from "./components/contrat/contract-add/contract-add.component";
import {DepartmentDetailComponent} from "./components/department/department-detail/department-detail.component";
import {PosteComponent} from "./components/poste/poste.component";
import {PosteAddComponent} from "./components/poste/poste-add/poste-add.component";


@NgModule({
  declarations: [],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HrRoutingModule, SharedModule,EmployeeComponent,DepartmentComponent,EmployeeAddComponent,EmployeeDetailComponent,DepartmentAddComponent,EmployeeDetailComponent,ContratComponent,ContractAddComponent,DepartmentDetailComponent,PosteComponent,PosteAddComponent],
})
export class HrModule {}
