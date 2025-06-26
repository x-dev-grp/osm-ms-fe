import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Title } from '@angular/platform-browser';

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

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
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
  providers: [Title],
  bootstrap: []
})
export class AppModule {}
