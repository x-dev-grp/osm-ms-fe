import { Component, OnInit, ViewChild, inject, Renderer2 } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatTooltipModule }   from '@angular/material/tooltip';
import { CommonModule }       from '@angular/common';
import { SharedModule } from '../../demo/shared/shared.module';
import { AbleProConfig } from '../../app-config';
import { ThemeLayoutService } from '../../@theme/services/theme-layout.service';
import { OsmDashboard } from 'src/app/shared/modules/osm-dashboard/osm-dashboard';
import { AttributeType, DashboardConfig, FieldType } from 'src/app/shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from 'src/app/shared/models/advanced-search/searchOperation';


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

  ngOnInit(): void {
    
  }
  config:DashboardConfig = {
    title: 'Gestion des utilisateurs',
    baseURL: 'security',
    searchEndpoint: 'security/user',
    addNewItem: true,
    addNewItemUrl: 'settings/users/add',
    fileName: 'utilisateur',
    actions:{

            statusMapping:false,
            actionsList:
              [
                {
                  label:"consulter",         
                },
                {
                  label:"modier"
                },
                {
                  label:"spprimer"
                }

            ],
           
        },
   
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
        options:[
          {
            label:"Oui",
            value:true
          },
          {
            label:"Non",
            value:false
          },
          
        ]
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
      // {
      //   name: 'createdDate',
      //   label: 'Created Date',
      //   attributeType: AttributeType.date,
      //   fieldType: FieldType.date,
      //   sortable: true,
      //   filterable: true,
      //   defaultFilter: true,
      //   dataTable:true,
      //   exportable:true,
      //   exportLabel:'Created Date',
      //   exportLabelTranslatePath:'generic-type.created-date',
      // },
      // {
      //   name: 'updatedDate',
      //   label: 'Updated Date',
      //   attributeType: AttributeType.date,
      //   fieldType: FieldType.date,
      //   sortable: true,
      //   filterable: true,
      //   defaultFilter: true,
      //   dataTable:true,
      // },
      // {
      //   name: 'amount',
      //   label: 'Montant',
      //   attributeType: AttributeType.number,
      //   fieldType: FieldType.slider,
      //   sortable: false,
      //   filterable: true,
      //   defaultFilter: true,
      //   dataTable:true,
      //   sliderMinValue: 0,
      //   sliderMaxValue: 10000,
      //   exportable:true,
      //   exportLabel:'Montant',

      // },

    ],
  }

  applyAction(event:string){
    console.log(event);
  }
}
