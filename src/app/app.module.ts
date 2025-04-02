import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { AppRoutingModule } from './app-routing.module';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import { SignupComponent } from './components/signup/signup.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { SupplierComponent } from './osm/supplier/supplier.component';
import { QualityControlRuleComponent } from './osm/quality-control-rule/quality-control-rule.component';
 import {GenericTypeComponent} from "./osm/generic-type/generic-type.component";
import { DeliveryComponent } from './osm/delivery/delivery.component';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { SharedModule } from './demo/shared/shared.module';
import { LocalDateTimePipe } from './osm/pipes/local-date-time.pipe';

@NgModule({
  declarations: [LoginComponent, DashboardComponent, SignupComponent, PasswordResetComponent],
  imports: [
    AppRoutingModule, // Must explicitly import routing module
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    AppRoutingModule,
    FormsModule,
    MatToolbarModule,
    ReactiveFormsModule,
    AppComponent,
    DeliveryComponent,
    MatDialogActions,
    MatIcon,
    MatTable,
    MatDialogTitle,
    MatDialogContent,
    MatHeaderRow,
    MatRow,
    MatHeaderCell,
    MatColumnDef,
    MatDialogClose,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef,
    SharedModule,
    GenericTypeComponent,
    SupplierComponent,
    QualityControlRuleComponent,
    LocalDateTimePipe
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
