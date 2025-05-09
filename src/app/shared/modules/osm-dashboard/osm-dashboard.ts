import { AfterViewInit, Component, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';

import {  MatTableModule } from '@angular/material/table';
import {  ReactiveFormsModule } from '@angular/forms';
import {  MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import {
  MatExpansionModule,
} from '@angular/material/expansion';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { DashboardStore } from './services/dashboard-state.service';
import { DashboardConfig, Field } from './models/dashboard-config';
import { Router } from '@angular/router';
import { DynamicInput } from './components/dynamic-input/dynamic-input.component';

@Component({
  selector: 'osm-dashboard',
  templateUrl: './osm-dashboard.html',
  styleUrls: ['./osm-dashboard.scss'],
  standalone: true,
  providers:[DashboardStore],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    DynamicInput
  ]
})
export class OsmDashboard implements OnInit,AfterViewInit,OnChanges {

readonly _store=inject(DashboardStore);
_router=inject(Router);
config=input.required<DashboardConfig>();
applyAction=output<{row:any,action:string}>();
displayedColumns:string[]=[];
actions:string[]|undefined;
  ngOnInit(): void {
    this.displayedColumns=[...this.config().fields.filter((field)=>field.dataTable).map((field)=>field.label),'actions'];
    console.log(this.displayedColumns);
    this._store.initialize(this.config()?.searchEndpoint,this.config().fields,this.config()?.defaultSearchData,this.config().fileName);
    if(!this.config().actions?.statusMapping)
       this.actions=this.config().actions?.actionsList?.map(action=>action.action);
  }
  ngAfterViewInit(): void {
  
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }
  ngOnDestroy(): void {
    
  }
  sortChange(event:any){
    console.log(event);
    this._store.setSort(event.active,event.direction);
  }
  onPageChange(event:any){
    this._store.setPageSize(event?.pageSize);
    this._store.setPage(event?.pageIndex);
  }
  getValue(path: string,object:any): any {
    return path?.split('.')?.reduce((acc, key) => acc && acc[key], object);
  }
  redirectToFormPage(){
    this._router.navigate([this.config().addNewItemUrl]);
  }
  onFilterFieldChange(event:any,field: Field) { 
    this._store.setFilteredField(field,event?.target["checked"]);
  }
  onExportFieldChange(event:any,field: Field) {
    this._store.setExportField(field,event?.target["checked"]);
  }
  selectAllFilterFields(event:any){
     this._store.setAllFilterField(event?.target["checked"])
  }
  selectAllExportFields(event:any,field: Field) {
    this._store.setAllExportField(event?.target["checked"]);    
  }
  resetFilter(){
    this._store.resetSearchData();
  }
  exportPdf(){
    this._store.export('pdf');
  }
  exportCsv(){
    this._store.export('excel');
  }

  mapActions(item:any):string[]{
    const configActions:any=this.config()?.actions?.actionsStatusList ;
    const statusAttribute=this.config().actions?.statusAttributeName || "status";
    const status=item[statusAttribute]?.trim();
    console.log({status:status,actions:configActions[status]?.map((action:any)=>action?.action)})
    return configActions[status]?.map((action:any)=>action?.action)|| []
  }
  actionApply(action:string,row:any){
    this.applyAction.emit({row:row,action:action});
  }
}
