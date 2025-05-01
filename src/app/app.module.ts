import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatToolbarModule} from "@angular/material/toolbar";


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
 import { SupplierComponent } from './reception/components/suppliers/suppliers.component';
 import { GenericTypeComponent } from './settings/generic-type/generic-type.component';
import { QualityControlRuleComponent } from './settings/quality-control-rule/quality-control-rule.component';

@NgModule({
  declarations: [],
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
   ],
  providers: [],
  bootstrap: []
})
export class AppModule {}
