import {  Component, DestroyRef, inject, OnInit } from '@angular/core';

import {FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';

import { PermissionComponent } from '../permission-component/permission.component';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Role } from 'src/app/shared/models/security/role.model';
import { RoleService } from '../../services/role.service';
import { catchError, EMPTY, tap } from 'rxjs';


@Component({
  selector: 'user-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    PermissionComponent
  ]
})
export class RoleFormComponent implements OnInit {
  _router=inject( Router);
  _fb=inject(FormBuilder);
    _service=inject(RoleService);
  _activatedRoute=inject(ActivatedRoute)
  readonly destroyRef = inject(DestroyRef);
  roleForm:FormGroup;
  viewMode:boolean=false;
  updateMode:boolean=false;
  role:Role;
  loading:boolean=false;
  selectedPermissions: any[];
  ngOnInit(): void {
     this.roleForm = this._fb.group({
    roleName: ['', [Validators.required]],
    description:[null]
  });
  this.getRoutingData();
  }
    getRoutingData(){
      this._activatedRoute.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data:any) => {
        this.viewMode=!!data?.viewMode
        this.updateMode=!!data?.updateMode
        if(this.viewMode)  
          this.roleForm.disable()
        if(data?.role?.data?.length){
           this.role = data?.role?.data[0];
           this.roleForm.patchValue(this.role);
           this.selectedPermissions=this.role?.permissions?.map(
            permission=>permission?.id
           )
        }
      })
    }
  
  onPermissionsChange(permissions: string[]) {
    this.selectedPermissions = permissions;
  }
  
  saveRole(updateMode:boolean) {
    if (this.roleForm.valid) {
      let roleData = {
        ...this.roleForm.value,
        permissions: this.selectedPermissions.map(
          p=>{
           return{
                id:p?.id,
                permissionName:p?.permissionName,
                category:p?.category,
                module:p?.module
           } 

          }
        )
      };
      if(updateMode){
        roleData={
          ...roleData,
          id:this.role?.id
        }
      }
      this.loading=true;
      this._service.addRole(roleData).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response:any)=>{
          this._router.navigate(['/settings/roles']);
          this.loading = false;

        }),
        catchError((err: any) => {
        this.loading = false;
        console.log(err)
        return EMPTY;
        })
      ).subscribe()
            
    }
  }
  cancel(){
    this._router.navigate(['/settings/roles']);
  }
}
