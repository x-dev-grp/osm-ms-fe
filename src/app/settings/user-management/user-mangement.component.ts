import { Component, OnInit, ViewChild, inject, Renderer2 } from '@angular/core';

import { CommonModule }       from '@angular/common';
import { SharedModule } from '../../demo/shared/shared.module';

import { OsmDashboard } from 'src/app/shared/modules/osm-dashboard/osm-dashboard';
import { Action, AttributeType, DashboardConfig, FieldType } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { Router } from '@angular/router';


@Component({
  selector: 'app-application-config',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './user-mangement.component.html',
  styleUrls: ['./user-mangement.component.scss']
})
export class UserManagementComponent implements OnInit {
  _router=inject(Router);
  ngOnInit(): void {

  }
  config:DashboardConfig = {
    title: 'Gestion des utilisateurs',
    baseURL: 'security/user',
    searchEndpoint: 'security/user',
    addNewItem: true,
    addNewItemUrl: 'settings/users/add',
    fileName: 'utilisateur',

    fields: [
      {
        name: 'username',
        label: "Nom d'utilisateur",
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,

      },
      {
        name: 'email',
        label: "Email",
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,

      },
      {
        name: 'phoneNumber',
        label: "Numéro de téléphone",
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,

      },
      {
        name: 'confirmationMethod',
        label: "Méthode de confirmation",
        attributeType: AttributeType.enum,
        fieldType: FieldType.select,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,
        options:[
          {
            label:"Email",
            value:"EMAIL"
          },
          {
            label:"Téléphone",
            value:"PHONE"
          },

        ]


      },
      {
        name: 'locked',
        booleanAttributeName:'isLocked',
        label: "Désactiver",
        attributeType: AttributeType.boolean,
        fieldType: FieldType.checkbox,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,
      },
      {
        name: 'role',
        label: "Role",
        attributeType: AttributeType.object,
        fieldType: FieldType.autocomplete,
        sortable: true,
        filterable: true,
        defaultFilter: false,
        dataTable:true,
        exportable:true,
        getOptionsUrl:"security/role",
        valuePath:"roleName"
      }
    ],
  }

  applyAction(event:{row:any,action:string}){
    console.log(event);
    switch (event?.action?.toUpperCase()) {
      case "READ":
        this._router.navigate(['/settings/users/view',event.row?.id]);
        break;
      case "UPDATE":
        this._router.navigate(['/settings/users/update',event.row?.id]);

        break;
      default:
        break;
    }
  }
}
