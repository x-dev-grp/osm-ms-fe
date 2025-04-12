import {Component, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from "@angular/material/expansion";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators,FormArray} from "@angular/forms";
import {MatSortModule} from "@angular/material/sort";
import {SharedModule} from "../../../demo/shared/shared.module";
import {ConfigurationComponent} from "../../../@theme/layouts/configuration/configuration.component";
import {Delivery, OliveLotStatus} from "../../../osm/models/delivery";
import { MatSnackBar } from '@angular/material/snack-bar';


import {Supplier} from "../../../osm/models/supplier";

import {DeliveryType} from "../../models/delevery";
import {OperationType} from "../../models/UnifiedDelivery";

@Component({
  selector: 'app-bonReception',
  standalone:true,
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
  ],  templateUrl: './bonreception.component.html',
  styleUrl: './bonreception.component.scss'
})
export class BonReceptionComponent {

  deliveryTypes = Object.values(DeliveryType); // ['OLIVE', 'HUILED']
  selectedDeliveryType: DeliveryType | null = null;
  isFormVisible: boolean = false;
  operationTypes = Object.values(OperationType); // ['ACHAT', 'CHANGEMENT']
  oliveLotStatuses = Object.values(OliveLotStatus); // ['BON', 'ACCEPTABLE', 'MAUVAIS']
  suppliers:Supplier[]=[];



  // Variables pour gérer l'état
  selectedReception: any [] | null = null;
  formOpen: boolean = false;
  isEditing: boolean = false;
  showAllCards: boolean = true; // Contrôle l'affichage de tous les cards

  deliveries: any[] = []; // la liste des livraisons
  displayedColumns: string[] = ['receptionType', 'supplier', 'deliveryDate', 'status', 'action'];
  // Formulaire Reactif
  receptionForm: FormGroup;
  deliveryForm:FormGroup;

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar

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
      parcel: [''],
    });


  }
  ngOnInit(): void {

   /* this.deliveryService.getOliveVarieties().subscribe(data => this.oliveVarieties = data);
    this.deliveryService.getOliveTypes().subscribe(data => this.oliveTypes = data);
    this.deliveryService.getOilVarieties().subscribe(data => this.oilVarieties = data);
    this.deliveryService.getTransporters().subscribe(data => this.transporters = data);
    this.deliveryService.getProductionMethods().subscribe(data => this.productionMethods = data);
    this.deliveryService.getSupplierTypes().subscribe(data => this.supplierTypes = data);*/
    const stored = sessionStorage.getItem('deliveries');
    if (stored) {
      this.deliveries = JSON.parse(stored);
    }

  }

  // Méthode pour sélectionner un type de réception
  // Méthode pour soumettre le formulaire


  priceList = [
    {
      id:'recepetionolive',
      border: 'border-success',
      background: 'bg-success-50',
      name: 'Réception Olive',

      color: 'text-success-500',
    },
    {
      id:'recepetionhuile',
      border: 'border-primary',
      background: 'bg-primary-50',
      name: 'Réception Huile',

      color: 'text-primary-500',
    },
  ];

  editDelivery(delevery:any){}
  selectReception(reception: any) {
    this.selectedReception = reception;
    this.formOpen = true;

    // Pré-remplir le champ "deliveryType" dans le formulaire
    this.deliveryForm.patchValue({
      deliveryType: reception.code // par exemple 'OLIVE' ou 'HUILE'
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
  deleteDelivery(){}

  getEmptyDelivery(): Delivery {
    return {
      receiptNumber: '',
      millingMachine: undefined,
      lotNumber: '',
      deliveryDate: '',
      trtDate: '',
      status: OliveLotStatus.NEW,
      globalLotNumber: '',
      tierOrBase: '',
      parcel: '',
      oliveQuantity: 0,
      oilQuantity: 0,
      region: undefined,
      oliveVariety: undefined,
      oilType: undefined,
      oilVariety: undefined,
      storageUnit: undefined,
      supplier: undefined,
      unitPrice: 0,
      price: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      qualityControlResults: []
    };
  }

  get qualityControlResults() {
    return this.receptionForm.get('qualityControlResults') as FormArray;
  }

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
