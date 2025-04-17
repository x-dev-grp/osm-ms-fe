import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../../@theme/layouts/configuration/configuration.component';
import { Delivery } from '../../../osm/models/delivery';
import { MatSnackBar } from '@angular/material/snack-bar';

import {  UnifiedDelivery } from '../../models/UnifiedDelivery';
import { deliveryType } from '../../../osm/models/deleveryType';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
 import { BaseType } from '../../../osm/models/base-type';
import { TransporterService } from '../../../osm/services/TransporterService';
import { Transporter } from '../../../shared/models/Transporter';
import { DeliveryType } from '../../models/deleveryType';
import { SupplierType } from '../../models/SupplierType';
import { TypeCategory } from '../../../osm/models/type-category.enum';

@Component({
  selector: 'app-bonreception',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatExpansionPanelHeader,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    ConfigurationComponent,
    MatExpansionPanel,
    MatExpansionPanelTitle
  ],
  templateUrl: './bonreception.component.html',
  styleUrl: './bonreception.component.scss'
})
export class BonReceptionComponent implements OnInit {
  deliveryTypes = Object.values(DeliveryType); // ['OLIVE', 'HUILED']
  selectedDeliveryType: DeliveryType | null = null;
  isFormVisible: boolean = false;
  operationTypes :BaseType[] = []; // ['ACHAT', 'CHANGEMENT']
  oliveLotStatuses = Object.values(OliveLotStatus); // ['BON', 'ACCEPTABLE', 'MAUVAIS']
  suppliers: SupplierType[] = [];

  // Variables pour gérer l'état
  selectedReception: UnifiedDelivery | null = null;
  formOpen: boolean = false;
  isEditing: boolean = false;
  showAllCards: boolean = true; // Contrôle l'affichage de tous les cards

  deliveries: UnifiedDelivery[] = []; // la liste des livraisons
  displayedColumns: string[] = ['receptionType', 'supplier', 'deliveryDate', 'status', 'action'];
  // Formulaire Reactif
  receptionForm: FormGroup;
  deliveryForm: FormGroup;
  public regions: BaseType[] = [];
  public supplierTypes: BaseType[] = [];
  public wasteTypes: BaseType[] = [];
  public oliveVarieties: BaseType[] = [];
  public oliveTypes: BaseType[] = [];
  public productionMethods: BaseType[] = [];
  public oilVarieties: BaseType[] = [];
  public transporters: Transporter[] = [];
  priceList = [
    {
      id: 'recepetionolive',
      border: 'border-success',
      background: 'bg-success-50',
      name: 'Réception Olive',

      color: 'text-success-500'
    },
    {
      id: 'recepetionhuile',
      border: 'border-primary',
      background: 'bg-primary-50',
      name: 'Réception Huile',

      color: 'text-primary-500'
    }
  ];

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private deliveryService: UnifiedDeliveryService,
    private transportersService: TransporterService,
    private genericTypeService: GenericTypeService
  ) {
    this.receptionForm = this.fb.group({
      // Champs communs
      deliveryNumber: [''],
      deliveryType: [''], // Sera rempli automatiquement au clic
      lotNumber: [''],
      deliveryDate: [new Date()],
      region: [null],
      poidsBrute: [0],
      poidsNet: [0],
      matriculeCamion: [''],
      etatCamion: [''],
      supplier: [null],
      qualityControlResults: this.fb.array([]),

      // Champs spécifiques à l'huile
      globalLotNumber: [''],
      oilVariety: [null],
      oilQuantity: [null],
      unitPrice: [null],
      price: [null],
      paidAmount: [null],
      unpaidAmount: [null],
      oilType: [null],

      // Champs spécifiques à l'olive
      trtDate: [null],
      operationType: [null],
      oliveVariety: [null],
      sackCount: [null],
      oliveType: [null],
      status: [null],
      rendement: [null],
      oliveQuantity: [null],
      parcel: ['']
    });
  }

  // Méthode pour sélectionner un type de réception
  // Méthode pour soumettre le formulaire

  get qualityControlResults() {
    return this.receptionForm.get('qualityControlResults') as FormArray;
  }

  ngOnInit(): void {
    // Transporters call and logging the result after subscription.
    this.transportersService.getAllTransporters().subscribe((transporters) => {
      this.transporters = transporters.data;
      console.log('Loaded Transporters:', this.transporters);
    });

    // Calling loadRecords for each type category:
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.PRODUCTION_METHOD);
    this.loadRecords(TypeCategory.OLIVE_VARIETY);
    this.loadRecords(TypeCategory.OLIVE_TYPE);
    this.loadRecords(TypeCategory.OIL_VARIETY);
    this.loadRecords(TypeCategory.OPERATION_TYPE);

    // Deliveries call and logging the result after subscription.
    this.deliveryService.getAllDeliveriesList().subscribe((data) => {
      //this.deliveries = data.data;
      console.log('Loaded Deliveries:', this.deliveries);
    });

    // If you needed to log static sessionStorage data, uncomment and use:
    // const stored = sessionStorage.getItem('deliveries');
    // if (stored) {
    //   this.deliveries = JSON.parse(stored);
    //   console.log('Loaded Deliveries from sessionStorage:', this.deliveries);
    // }
  }

  loadRecords(category: TypeCategory): void {
    this.genericTypeService.getAllTypes(category).subscribe(
      (res: { success: boolean; data: BaseType[]; message: string }) => {
        if (res.success && res.data) {
          // Using explicit if/else to fill in the appropriate list and log the output.
          if (category === TypeCategory.REGION) {
            this.regions = res.data;
            console.log('Loaded Regions:', this.regions);
          } else if (category === TypeCategory.SUPPLIER_TYPE) {
            this.supplierTypes = res.data;
            console.log('Loaded Supplier Types:', this.supplierTypes);
          } else if (category === TypeCategory.WASTE_TYPE) {
            this.wasteTypes = res.data;
            console.log('Loaded Waste Types:', this.wasteTypes);
          } else if (category === TypeCategory.OPERATION_TYPE) {
            this.operationTypes = res.data;
            console.log('Loaded OPERATION_TYPE:', this.operationTypes);
          } else if (category === TypeCategory.OLIVE_VARIETY) {
            this.oliveVarieties = res.data;
            console.log('Loaded Olive Varieties:', this.oliveVarieties);
          } else if (category === TypeCategory.OLIVE_TYPE) {
            this.oliveTypes = res.data;
            console.log('Loaded Olive Types:', this.oliveTypes);
          } else if (category === TypeCategory.PRODUCTION_METHOD) {
            this.productionMethods = res.data;
            console.log('Loaded Production Methods:', this.productionMethods);
          } else if (category === TypeCategory.OIL_VARIETY) {
            this.oilVarieties = res.data;
            console.log('Loaded Oil Varieties:', this.oilVarieties);
          }
        } else {
          // If the response is unsuccessful or there is no data, we set the list to empty and log.
          if (category === TypeCategory.REGION) {
            this.regions = [];
            console.log('Loaded Regions (empty):', this.regions);
          } else if (category === TypeCategory.SUPPLIER_TYPE) {
            this.supplierTypes = [];
            console.log('Loaded Supplier Types (empty):', this.supplierTypes);
          } else if (category === TypeCategory.WASTE_TYPE) {
            this.wasteTypes = [];
            console.log('Loaded Waste Types (empty):', this.wasteTypes);
          } else if (category === TypeCategory.OLIVE_VARIETY) {
            this.oliveVarieties = [];
            console.log('Loaded Olive Varieties (empty):', this.oliveVarieties);
          } else if (category === TypeCategory.OLIVE_TYPE) {
            this.oliveTypes = [];
            console.log('Loaded Olive Types (empty):', this.oliveTypes);
          } else if (category === TypeCategory.PRODUCTION_METHOD) {
            this.productionMethods = [];
            console.log('Loaded Production Methods (empty):', this.productionMethods);
          } else if (category === TypeCategory.OIL_VARIETY) {
            this.oilVarieties = [];
            console.log('Loaded Oil Varieties (empty):', this.oilVarieties);
          }
        }
      },
      (err) => {
        console.error(`Error loading records for ${category}:`, err);
        // In case of an error, also set the affected list to empty and log it.
        if (category === TypeCategory.REGION) {
          this.regions = [];
          console.log('Loaded Regions (error):', this.regions);
        } else if (category === TypeCategory.SUPPLIER_TYPE) {
          this.supplierTypes = [];
          console.log('Loaded Supplier Types (error):', this.supplierTypes);
        } else if (category === TypeCategory.WASTE_TYPE) {
          this.wasteTypes = [];
          console.log('Loaded Waste Types (error):', this.wasteTypes);
        } else if (category === TypeCategory.OLIVE_VARIETY) {
          this.oliveVarieties = [];
          console.log('Loaded Olive Varieties (error):', this.oliveVarieties);
        } else if (category === TypeCategory.OLIVE_TYPE) {
          this.oliveTypes = [];
          console.log('Loaded Olive Types (error):', this.oliveTypes);
        } else if (category === TypeCategory.PRODUCTION_METHOD) {
          this.productionMethods = [];
          console.log('Loaded Production Methods (error):', this.productionMethods);
        } else if (category === TypeCategory.OIL_VARIETY) {
          this.oilVarieties = [];
          console.log('Loaded Oil Varieties (error):', this.oilVarieties);
        }
      }
    );
  }

  selectReception(reception: UnifiedDelivery) {
    this.selectedReception = reception;
    this.formOpen = true;

    // Pré-remplir le champ "deliveryType" dans le formulaire
    this.deliveryForm.patchValue({
      deliveryType: reception.deliveryType // par exemple 'OLIVE' ou 'HUILE'
    });
  }

  ajouterReception() {
    if (this.deliveryForm.valid) {
      const newDelivery = { ...this.deliveryForm.value };

      // Ajouter à la liste locale
      this.deliveries.push(newDelivery);

      // Enregistrement dans sessionStorage
      sessionStorage.setItem('deliveries', JSON.stringify(this.deliveries));

      // Toast de succès
      this.snackBar.open('Livraison enregistrée avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-success']
      });

      // Réinitialisation
      this.deliveryForm.reset();
      this.formOpen = false;
      this.selectedReception = null;
    } else {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires.', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }

  deleteDelivery() {}



  addQualityControl() {
    const newControl = this.fb.group({
      result: ['']
    });
    this.qualityControlResults.push(newControl);
  }

  removeQualityControl(index: number) {
    this.qualityControlResults.removeAt(index);
  }

  onDeliveryTypeSelected(deliveryType: DeliveryType) {
    this.selectedDeliveryType = deliveryType;
    this.receptionForm.patchValue({ deliveryType }); // Mettre à jour le champ deliveryType

    // Réinitialiser les champs spécifiques pour éviter des valeurs résiduelles
    this.resetSpecificFields();
  }

  resetSpecificFields() {
    const formControls = this.receptionForm.controls;

    // Réinitialiser les champs spécifiques à l'huile
    formControls['globalLotNumber'].reset();
    formControls['oilVariety'].reset();
    formControls['oilQuantity'].reset();
    formControls['unitPrice'].reset();
    formControls['price'].reset();
    formControls['paidAmount'].reset();
    formControls['unpaidAmount'].reset();
    formControls['oilType'].reset();

    // Réinitialiser les champs spécifiques à l'olive
    formControls['trtDate'].reset();
    formControls['operationType'].reset();
    formControls['oliveVariety'].reset();
    formControls['sackCount'].reset();
    formControls['oliveType'].reset();
    formControls['status'].reset();
    formControls['rendement'].reset();
    formControls['oliveQuantity'].reset();
    formControls['parcel'].reset();
  }

  onSubmit() {
    console.log(this.receptionForm.value);
  }

  cancelEdit() {
    // Logique pour annuler l'édition
  }
}
