import {  Component, DestroyRef, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, tap } from 'rxjs';
import { Role } from 'src/app/shared/models/security/role.model';
import { BaseService } from 'src/app/shared/services/base.service';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'user-form',
  templateUrl: './role-dashboard.component.html',
  styleUrls: ['./role-dashboard.component.scss'],
  standalone: true,
  imports: [TranslateModule, 
    CommonModule,
    SharedModule  ]
})
export class RoleDashboardComponent implements OnInit {
  _router=inject(Router);
  _service=inject(RoleService);
   _baseService=inject(BaseService);
   deleteLoanding:boolean=false;
  readonly destroyRef = inject(DestroyRef);
  ngOnInit(): void {
    this.fetchRoles();
  }
  fetchRoles(){
    this._service.fetchAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response:any)=>{
        this.roles=response;
      })
     ).subscribe();
  }
 roles: Role[] = [];

  userCountMapping: {[k: string]: string} = {
    '=0': 'No users',
    '=1': '1 user',
    'other': '# users'
  };

  defaultRoleIds = ['', ''];

  constructor() {

  }

  onViewRole(role: Role): void {
    this._router.navigate(['/settings/roles/view',role?.id]);
}

  onEditRole(role: Role): void {
        this._router.navigate(['/settings/roles/update',role?.id]);

  }

  onDeleteRole(role: Role): void {
    this.deleteLoanding=true;
    this._baseService.deleteItem("security/role",role?.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(res=>{
       this.deleteLoanding=false;
       this.fetchRoles();
      }),
      catchError((err:any)=>{
        console.log(err);
        this.deleteLoanding=false;
        return EMPTY;
      })
    ).subscribe();
  }

  onAddRole(): void {
    this._router.navigate(['/settings/roles/add']);
  }

  onDuplicateRole(role: Role): void {
  }

  isDefaultRole(role: Role): boolean {
    return this.defaultRoleIds.includes(role.id);
  }

  getRoleIcon(role: Role): string {
    switch(role?.roleName?.toUpperCase()) {
      case 'ADMIN': return 'admin_panel_settings';
      default: return 'person';
    }
  }

  getHighlightPermissions(role: Role): string[] {
    return role.permissions.slice(0, 3);
  }

  formatPermissionName(permId: string): string {
    if (!permId) return '';

    const parts = permId.split('-');
    if (parts.length >= 2) {
      const resource = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const action = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `${action} ${resource}`;
    }

    return permId;
  }

}
