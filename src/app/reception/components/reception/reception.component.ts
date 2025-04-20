import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../../@theme/layouts/configuration/configuration.component';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { OliveLotStatus } from '../../../shared/models/OliveLotStatus';
import { DeliveryType } from '../../models/deleveryType';
import { BaseType } from '../../../shared/models/base-type';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
 import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { Transporter } from '../../models/Transporter';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { TransporterService } from '../../../shared/services/TransporterService';
import { SupplierTypeService } from '../../../shared/services/supplier-type.service';

@Component({
  selector: 'app-reception',
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
  templateUrl: './reception.component.html',
  styleUrl: './reception.component.scss'
})
export class ReceptionComponent implements OnInit {
  deliveryTypes = Object.values(DeliveryType); // ['OLIVE', 'HUILED']
  selectedDeliveryType: DeliveryType | null = null;
  isFormVisible: boolean = false;
  oliveLotStatuses = Object.values(OliveLotStatus); // ['BON', 'ACCEPTABLE', 'MAUVAIS']
  //suppliers: Supplier[] = [];

  // Variables pour gérer l'état
  selectedReception: UnifiedDelivery[] | null = null;
  formOpen: boolean = false;
  isEditing: boolean = false;
  selectedDeliveryId: string | null = null;

  showAllCards: boolean = true; // Contrôle l'affichage de tous les cards

  deliveries: UnifiedDelivery[] = []; // la liste des livraisons
  displayedColumns: string[] = [
    'receptionType',
    'receiptNumber',
    'lotNumber',
    'globalLotNumber',
    'supplier',
    'deliveryDate',
    'oliveQuantity',
    'status',
    'actions'
  ];
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
      id: 'OLIVE',
      border: 'border-success',
      background: 'bg-success-50',
      name: 'OLIVE',

      color: 'text-success-500'
    },
    {
      id: 'OIL',
      border: 'border-primary',
      background: 'bg-primary-50',
      name: 'OIL',

      color: 'text-primary-500'
    }
  ];
  FilterSource: MatTableDataSource<UnifiedDelivery> = new MatTableDataSource(this.deliveries);
  private message: string;
  suppliers: any[] = [];

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private transportersService: TransporterService,
    private genericTypeService: GenericTypeService,
    private snackBar: MatSnackBar,
    private supplierService: SupplierTypeService
    // private supplierServices : SupplierService //il faut etre recupere de supplier Service non supplier type
  ) {
    this.receptionForm = this.fb.group({
      // Champs communs
      deliveryNumber: ['', Validators.required],
      deliveryType: [''],
      lotNumber: ['', Validators.required],
      deliveryDate: [new Date(), Validators.required],
      region: [null, Validators.required],
      poidsBrute: [0, Validators.min(0)],
      poidsNet: [0, Validators.min(0)],
      matriculeCamion: ['', Validators.required],
      etatCamion: ['', Validators.required],
      supplier: [null, Validators.required],

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
      oliveVariety: [null],
      sackCount: [null],
      oliveType: [null],
      status: [null],
      rendement: [null],
      oliveQuantity: [null],
      parcel: ['']
    });
  }

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadRecords(TypeCategory.SUPPLIER_TYPE);
    this.loadRecords(TypeCategory.PRODUCTION_METHOD);
    this.loadRecords(TypeCategory.OLIVE_VARIETY);
    this.loadRecords(TypeCategory.OLIVE_TYPE);
    this.loadRecords(TypeCategory.OIL_VARIETY);
    this.loadRecords(TypeCategory.OPERATION_TYPE);
    this.loadRecords(TypeCategory.REGION);
    this.loadSuppliers();
  }

  showToast(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }
  loadDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe(
      (res) => {
        if (res && res.success) {
          this.deliveries = res.data;

          const parsedLotNumbers = this.deliveries
            .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '') // remove prefix
            .map((numStr) => parseInt(numStr, 10)) // parse to number
            .filter((n) => !isNaN(n)); // keep valid numbers only

          const maxLotNumber = parsedLotNumbers.length > 0 ? Math.max(...parsedLotNumbers) : 1;

          console.log('Max Lot Number:', maxLotNumber);

          this.FilterSource.data = this.deliveries;
          this.message = res.message;
        } else {
          this.deliveries = [];
          this.message = res.message;
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
  }

  deleteDelivery(delivery: UnifiedDelivery): void {
    if (!delivery.id) return;
    this.deliveryService.deleteUnifiedDelivery(delivery.id).subscribe(
      (res) => {
        if (res && res.success) {
          //this.loadDeliveries();
          this.message = res.message;
        }
      },
      (err) => console.error('Error deleting delivery', err)
    );
  }

  /*openDialog(delivery: UnifiedDelivery) {
    this.formOpen = true;
  }*/

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      (res) => {
        if (res && res.success) {
          this.suppliers = res.data;
          console.log('Fournisseurs chargés :', this.suppliers);
        } else {
          this.suppliers = [];
          console.warn('Message du serveur :', res.message);
        }
      },
      (err) => {
        console.error('Erreur lors du chargement des fournisseurs', err);
      }
    );
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

  selectReception(list: any) {
    // Mettre à jour la sélection courante avec l'élément sélectionné
    this.selectedReception = list;

    // Ouvrir le panneau du formulaire
    this.formOpen = true;

    // Remplir automatiquement le champ "deliveryType" avec le nom de la carte sélectionnée
    this.receptionForm.patchValue({
      deliveryType: list.name // Utiliser le nom de la carte ('Réception Olive' ou 'Réception Huile')
    });

    // Optionnel : Réinitialiser les champs spécifiques pour éviter des valeurs résiduelles
    this.resetSpecificFields();
  }

  // ajouter une reception
  selectedReceptionId?: string;

  formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString(); // <-- renvoie "2025-04-16T16:25:59.000Z"
  }

  // Ajouter / Modifier Reception
  Enregistrer(): void {
    // Vérifier si le formulaire est valide
    if (this.receptionForm.invalid) {
      this.showToast('Veuillez remplir tous les champs obligatoires.', 4000);
      return;
    }

    // Récupérer les valeurs du formulaire
    const formValue = this.receptionForm.value;

    // Nettoyer et formater les valeurs du formulaire
    const cleanedFormValue = this.cleanPayload(formValue);

    // Validation supplémentaire pour les champs complexes
    if (!cleanedFormValue.region || !cleanedFormValue.region.id) {
      this.showToast('Veuillez sélectionner une région valide.', 4000);
      return;
    }

    if (!cleanedFormValue.supplier || !cleanedFormValue.supplier.id) {
      this.showToast('Veuillez sélectionner un fournisseur valide.', 4000);
      return;
    }

    // Construire le payload
    const payload: any = {
      id: this.isEditing ? this.selectedReceptionId : undefined,
      deliveryNumber: cleanedFormValue.deliveryNumber,
      deliveryType: cleanedFormValue.deliveryType,
      lotNumber: cleanedFormValue.lotNumber,
      deliveryDate: this.formatDate(cleanedFormValue.deliveryDate),
      region: cleanedFormValue.region, // Formaté comme { id: "123", name: "test-region" }
      poidsBrute: cleanedFormValue.poidsBrute,
      poidsNet: cleanedFormValue.poidsNet,
      matriculeCamion: cleanedFormValue.matriculeCamion,
      etatCamion: cleanedFormValue.etatCamion,
      supplier: cleanedFormValue.supplier, // Formaté comme { id: "456", name: "test-supplier" }
      globalLotNumber: cleanedFormValue.globalLotNumber,
      oilVariety: cleanedFormValue.oilVariety, // Formaté comme { id: "789", name: "test-oil-variety" }
      oilQuantity: cleanedFormValue.oilQuantity,
      unitPrice: cleanedFormValue.unitPrice,
      price: cleanedFormValue.price,
      paidAmount: cleanedFormValue.paidAmount,
      unpaidAmount: cleanedFormValue.unpaidAmount,
      oilType: cleanedFormValue.oilType, // Formaté comme { id: "101", name: "test-oil-type" }
      trtDate: this.formatDate(cleanedFormValue.trtDate),

      oliveVariety: cleanedFormValue.oliveVariety, // Formaté comme { id: "303", name: "test-olive-variety" }
      sackCount: cleanedFormValue.sackCount,
      oliveType: cleanedFormValue.oliveType, // Formaté comme { id: "404", name: "test-olive-type" }
      status: cleanedFormValue.status,
      rendement: cleanedFormValue.rendement,
      oliveQuantity: cleanedFormValue.oliveQuantity,
      parcel: cleanedFormValue.parcel
    };

    // Appel du service pour créer ou mettre à jour la réception
    const request$ = this.isEditing
      ? this.deliveryService.updateUnifiedDelivery(payload)
      : this.deliveryService.createUnifiedDelivery(payload);

    // Souscrire à la réponse du backend
    request$.subscribe({
      next: (res) => {
        if (res.success) {
          const message = this.isEditing ? 'Réception mise à jour avec succès.' : 'Réception ajoutée avec succès.';
          this.showToast(message);
          this.resetForm();
        } else {
          this.showToast(res.message || "Échec de l'opération.");
        }
      },
      error: (err) => {
        console.error(err);
        this.showToast(this.isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de l’ajout');
      }
    });
  }

  // Méthode pour nettoyer et formater les valeurs du formulaire
  cleanPayload(payload: any): any {
    if (payload.deliveryType === 'OIL') {
      delete payload.oliveVariety;
      delete payload.oliveType;
      delete payload.sackCount;
      delete payload.trtDate;
      delete payload.rendement;
      delete payload.oliveQuantity;
      delete payload.status;
    } else if (payload.deliveryType === 'OLIVE') {
      delete payload.oilVariety;
      delete payload.oilQuantity;
      delete payload.oilType;
      delete payload.unitPrice;
      delete payload.price;
      delete payload.paidAmount;
      delete payload.unpaidAmount;
      delete payload.storageUnit;
    }
    return payload;
  }

  formatComplexField(field: any): any {
    if (!field) return null;
    if (typeof field === 'object' && field.id) {
      return { id: field.id };
    }
    return { id: field }; // au cas où tu reçois juste un ID
  }

  // Méthode pour réinitialiser le formulaire
  resetForm(): void {
    this.receptionForm.reset();
    this.isEditing = false;
    this.selectedReceptionId = undefined;
  }

  cancelEdit(): void {
    this.resetForm();
  }

  openDialog(delivery: UnifiedDelivery): void {
    this.deliveryForm.patchValue(delivery);
    this.isEditing = true;
    this.selectedDeliveryId = delivery.id!;
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
    formControls['oliveVariety'].reset();
    formControls['sackCount'].reset();
    formControls['oliveType'].reset();
    formControls['status'].reset();
    formControls['rendement'].reset();
    formControls['oliveQuantity'].reset();
    formControls['parcel'].reset();
  }
}
