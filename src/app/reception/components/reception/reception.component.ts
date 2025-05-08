import {Component, OnInit, ViewChild} from '@angular/core';
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
import { BaseType } from '../../../shared/models/base-type';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
 import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';
import { TransporterService } from '../../../shared/services/TransporterService';
 import {MatPaginator} from "@angular/material/paginator";
import { Router } from '@angular/router';
import { SupplierType } from '../../../shared/models/supplier-type';
import {SupplierTypeService} from "../../../shared/services/supplier.service";

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
  oliveLotStatuses = Object.values(OliveLotStatus); // ['BON', 'ACCEPTABLE', 'MAUVAIS']
  loading: boolean = false;
  receptionType: 'OLIVE' | 'OIL' | null = null;
  selectedReceptionId?: string;
  // Variables pour gérer l'état
  selectedReception: UnifiedDelivery;

  formOpen: boolean = false;
  isEditing: boolean = false;
  showAllCards: boolean = true; // Contrôle l'affichage de tous les cards
  deliveries: UnifiedDelivery[] = []; // la liste des livraisons
  displayedColumns: string[] = [
    'receptionType', 'receiptNumber', 'lotNumber',
    'globalLotNumber', 'supplier', 'deliveryDate',
    'oliveQuantity', 'status', 'actions'
  ];

  selectedType: string = '';
  selectedSupplier: string = '';
  selectedDate: Date | null = null;

  // Formulaire Reactif
  receptionForm: FormGroup;
  public regions: BaseType[] = [];
  public supplierTypes: BaseType[] = [];
  public wasteTypes: BaseType[] = [];
  public oliveVarieties: BaseType[] = [];
  public oliveTypes: BaseType[] = [];
  public productionMethods: BaseType[] = [];
  public oilVarieties: BaseType[] = [];
  public oilTypes: BaseType[] = [];
  priceList = [
    {
      id: 'OLIVE',
      border: 'border-success',
      background: 'bg-success-50',
      deliveryType: 'OLIVE',

      color: 'text-success-500'
    },
    {
      id: 'OIL',
      border: 'border-primary',
      background: 'bg-primary-50',
      deliveryType: 'OIL',

      color: 'text-primary-500'
    }
  ];
  FilterSource: MatTableDataSource<UnifiedDelivery> = new MatTableDataSource(this.deliveries);
  private message: string;
  suppliers: SupplierType[] = [];
  dataSource: MatTableDataSource<UnifiedDelivery> = new MatTableDataSource<UnifiedDelivery>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private originalData: UnifiedDelivery[];

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private transportersService: TransporterService,
    private genericTypeService: GenericTypeService,
    private snackBar: MatSnackBar,
    private supplierService: SupplierTypeService,
     private router: Router
  ) {
    this.receptionForm = this.fb.group({
      // Champs communs
      deliveryNumber: ['', Validators.required],
      deliveryType: [''],
      receptionType: [''],
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
      trtDate: [new Date()],
      oliveVariety: [null],
      sackCount: [null],
      oliveType: [null],
      status: [null],
      rendement: [null],
      oliveQuantity: [null],
      qualityControl: [null],
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
    // assigner le valeur du chmps parcel lors la selection du champs region
    this.receptionForm.get('region')?.valueChanges.subscribe((selectedRegion) => {
      if (selectedRegion && selectedRegion.name) {
        this.receptionForm.patchValue({
          parcel: selectedRegion.name
        });
      }
    });
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
    this.deliveryService.getAllDeliveriesList().subscribe((res) => {
      if (res && res.success) {
        this.deliveries = res.data;
        console.log(res)

        // Sauvegarde des données originales pour les filtres
        this.originalData = res.data;

        // Auto patch des champs
        const deliveryCount = this.deliveries.length;
        const parsedLotNumbers = this.deliveries
          .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '')
          .map((numStr) => parseInt(numStr, 10))
          .filter((n) => !isNaN(n));
        const maxLotNumber = parsedLotNumbers.length > 0 ? Math.max(...parsedLotNumbers) : 0;

        this.receptionForm.patchValue({
          deliveryNumber: deliveryCount + 1,
          lotNumber: maxLotNumber + 1
        });

        // Appliquer les filtres initiaux (même s'ils sont vides au départ)
        this.applyFilters();

        this.message = res.message;
      } else {
        this.deliveries = [];
        this.originalData = [];
        this.dataSource.data = [];
        this.message = res.message;
      }
    });
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
      deliveryType: list.deliveryType // Utiliser le nom de la carte ('Réception Olive' ou 'Réception Huile')
    });
    // Optionnel : Réinitialiser les champs spécifiques pour éviter des valeurs résiduelles
    this.resetSpecificFields();
  }

  formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString(); // <-- renvoie "2025-04-16T16:25:59.000Z"
  }

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
      region: cleanedFormValue.region,
      poidsBrute: cleanedFormValue.poidsBrute,
      poidsNet: cleanedFormValue.poidsNet,
      matriculeCamion: cleanedFormValue.matriculeCamion,
      etatCamion: cleanedFormValue.etatCamion,
      supplier: cleanedFormValue.supplier,
      globalLotNumber: cleanedFormValue.globalLotNumber,
      oilVariety: cleanedFormValue.oilVariety,
      oilQuantity: cleanedFormValue.oilQuantity,
      unitPrice: cleanedFormValue.unitPrice,
      price: cleanedFormValue.price,
      paidAmount: cleanedFormValue.paidAmount,
      unpaidAmount: cleanedFormValue.unpaidAmount,
      oilType: cleanedFormValue.oilType,
      qualityControl: cleanedFormValue.qualityControl,
      trtDate: this.formatDate(cleanedFormValue.trtDate),
      oliveVariety: cleanedFormValue.oliveVariety,
      sackCount: cleanedFormValue.sackCount,
      oliveType: cleanedFormValue.oliveType,
      status: cleanedFormValue.status,
      rendement: cleanedFormValue.rendement,
      oliveQuantity: cleanedFormValue.oliveQuantity,
      parcel: cleanedFormValue.parcel
    };
    console.log("Payload envoyé :", payload);
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

          // Mettre à jour ou ajouter dans dataSource.data
          if (this.isEditing) {
            // Mise à jour de la ligne existante
            const updatedData = this.dataSource.data.map((item) =>
              item.id === payload.id ? { ...item, ...payload } : item
            );
            this.dataSource.data = updatedData;
          } else {
            // Ajout d'une nouvelle ligne
            this.dataSource.data = [...this.dataSource.data, payload];
          }

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
    const cleaned = {...payload};

    if (payload.deliveryType === 'OIL') {
      cleaned.oliveVariety = null;
      cleaned.oliveType = null;
      cleaned.sackCount = null;
      cleaned.trtDate = null;
      cleaned.rendement = null;
      cleaned.oliveQuantity = null;
      cleaned.status = null;
    } else if (payload.deliveryType === 'OLIVE') {
      cleaned.oilVariety = null;
      cleaned.oilQuantity = null;
      cleaned.oilType = null;
      cleaned.unitPrice = null;
      cleaned.price = null;
      cleaned.paidAmount = null;
      cleaned.unpaidAmount = null;
      cleaned.storageUnit = null;
    }
    return cleaned;
  }

  // Méthode pour réinitialiser le formulaire
  resetForm(): void {
    // Réinitialiser le formulaire
    this.receptionForm.reset();

    // Désactiver le mode édition
    this.isEditing = false;

    // Fermer le panneau extensible
    this.formOpen = false;

    // Effacer l'ID de la réception sélectionnée
    this.selectedReceptionId = undefined;
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

  ubdateDelivery(delivery: UnifiedDelivery): void {
    // Vérifie que l'objet reçu est valide
    if (!delivery || !delivery.id) {
      this.showToast("Données de réception invalides.");
      return;
    }
    this.selectedReceptionId = delivery.id;
    this.isEditing = true;
    this.loading = true;
    // Récupère les données complètes de la réception via le service
    this.deliveryService.getUnifiedDelivery(this.selectedReceptionId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data && res.data.length > 0) {
          const fullReception = res.data[0];
          this.selectedReception = fullReception;
          this.formOpen = true;
          console.log("Region reçue :", fullReception.region);
          console.log("Fournisseur reçu :", fullReception.supplier);
          console.log(res)
          // Appel de la méthode pour remplir le formulaire avec les données
          this.updateForm(fullReception);
          // Log pour debug
          console.log("Données réception chargées :", fullReception);
          console.log(fullReception)

        } else {
          this.showToast("Impossible de charger les détails de la réception.");
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Erreur de chargement :", err);
        this.showToast("Erreur lors du chargement des détails de la réception.");
      }
    });
  }

  updateForm(data: any): void {
    console.log('oliveTypes dans updateForm au moment de patchValue :', this.oliveTypes);
    if (!data) return;
    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;

      // Si c'est déjà une instance de Date, retournez-la directement
      if (dateValue instanceof Date) {
        return dateValue;
      }
      // Si c'est une chaîne de caractères (format ISO ou autre)
      if (typeof dateValue === 'string') {
        const parsedDate = new Date(dateValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate; // Retourne la date si elle est valide
        }
      }
      // Si aucun format ne correspond, retournez null
      console.warn("Format de date non pris en charge :", dateValue);
      return null;
    };
    const formattedData = {
      ...data,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      trtDate: parseDate(data.trtDate), // Conversion avec parseDate
      region: this.regions.find(r => r.id === data.region?.id) || null,
      supplier: this.suppliers.find(s => s.id === data.supplier?.id) || null,
      oliveVariety: this.oliveVarieties.find(v => v.id === data.oliveVariety?.id) || null,
      oilVariety: this.oilVarieties.find(v => v.id === data.oilVariety?.id) || null,
      oliveType: this.oliveTypes.find(t => t.id === data.oliveType?.id) || null,
      oilType: this.oilTypes.find(t => t.id === data.oilType?.id) || null
    };

    console.log("Formatted trtDate:", formattedData.trtDate);
    console.log("oliveType dans updateForm:", formattedData.oliveType);
    console.log("Raw trtDate apres :", data.trtDate);
    // Affecter automatiquement le type selon la donnée
    if (data.oilQuantity !== null && data.oilQuantity !== undefined) {
      this.receptionType = 'OIL';
    } else if (data.oliveQuantity !== null && data.oliveQuantity !== undefined) {
      this.receptionType = 'OLIVE';
    } else {
      this.receptionType = null;
    }

    this.receptionForm.patchValue(formattedData);
  }

  viewDelivery(delivery: UnifiedDelivery): void {
    // Rediriger vers la route avec l'ID de la réception
    this.router.navigate(['reception/reception-details', delivery.id]);
  }
  QualityControl(delivery: UnifiedDelivery): void {
    // ouvrir dialog de contrôle qualité
    this.router.navigate(['reception/quality', delivery.id])
  }

  applyFilters() {
    let filtered = this.originalData;
    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(delivery => delivery.deliveryType === this.selectedType);
    }
    // Filtre par fournisseur
    if (this.selectedSupplier) {
      filtered = filtered.filter(delivery =>
        delivery.supplier?.supplierInfo?.name?.toLowerCase().includes(this.selectedSupplier.toLowerCase())
      );
    }
    // Filtre par date (en ignorant l'heure)
    if (this.selectedDate) {
      const selectedStr = this.dateFormat(this.selectedDate); // Normalise la date sélectionnée
      filtered = filtered.filter(delivery => {
        const deliveryDateStr = this.dateFormat(new Date(delivery.deliveryDate)); // Normalise la date de livraison
        return deliveryDateStr === selectedStr; // Compare uniquement les dates (pas les heures)
      });
    }
    this.dataSource.data = filtered;
  }

  dateFormat(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ajoute un 0 si nécessaire
    const day = String(date.getDate()).padStart(2, '0'); // Ajoute un 0 si nécessaire
    return `${year}-${month}-${day}`;
  }

  resetFilters(): void {
    this.selectedType = '';
    this.selectedSupplier = '';
    this.selectedDate = null;
    this.applyFilters();
  }

}
