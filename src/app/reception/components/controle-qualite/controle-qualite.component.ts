import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { DeliveryService } from '../../../osm/services/delivery.service';
import { Delivery } from '../../../osm/models/delivery';
import { QualityControlRuleService } from '../../services/quality-control-rule.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule, MatExpansionPanel, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../demo/shared/shared.module';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';

export interface QualityControlRule {
  id?: string; // original backend ID
  index: number; // NEW: for array-based tracking or loops
  ruleKey: string; // used to associate user-entered value
  oilQc?: boolean;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue?: number;
}

@Component({
  selector: 'app-controle-qualite',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginator,
    MatPaginatorModule,
    MatExpansionModule, // Import the expansion module

    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle
  ],
  templateUrl: './controle-qualite.component.html',
  styleUrl: './controle-qualite.component.scss',
  standalone: true
})
export class ControleQualiteComponent implements OnInit,AfterViewInit {
// État actuel : 'table', 'form', ou 'details'
  currentView: 'table' | 'form' | 'details' = 'table';  // Réception sélectionnée pour le contrôle qualité
  selectedReception: any = null;
  // Données du formulaire
  formFields: any = {};

  private staticData = [
    {
      id: 1,
      type: 'Huile',
      deliveryDate: new Date('2025-10-08'),
      supplier: { name: 'Fournisseur A' },
      status: 'En attente',
      qualityControlDone: false,
      qualityControlData: null
    },
    {
      id: 2,
      type: 'Olive',
      deliveryDate: new Date('2025-11-05'),
      supplier: { name: 'Fournisseur B' },
      status: 'Terminé',
      qualityControlDone: true,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 3,
      type: 'Huile',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur C' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: null
    },
    {
      id: 4,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur k' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 5,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur t' },
      status: 'En cours',
      qualityControlDone: true,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 6,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur c' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 7,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur b' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 8,
      type: 'huile',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur o' },
      status: 'En cours',
      qualityControlDone: true,
      qualityControlData: null

    },
    {
      id: 9,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur j' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 10,
      type: 'Olive',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur w' },
      status: 'En cours',
      qualityControlDone: false,
      qualityControlData: {
        oliveCondition: 'Bon',
        acceptanceStatus: 'Accepté'
      }
    },
    {
      id: 11,
      type: 'huile',
      deliveryDate: new Date('2025-10-10'),
      supplier: { name: 'Fournisseur d' },
      status: 'En cours',
      qualityControlDone: true,
      qualityControlData: null

    }

  ];
  deliveries: Delivery[] = [];
  selectedDeliveryId: string | null = null;

  paginatorSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['typeReception', 'date', 'fournisseur', 'etat', 'action'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  qualityRules: QualityControlRule[] = [];
  qualityControlResult: Record<string, number> = {}; // Same as {[key: string]: number}
  protected readonly Object = Object;

  constructor(
    private qcService: QualityControlRuleService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.paginatorSource.data = this.staticData;
    // Load available deliveries
    this.deliveryService.getAllDeliveriesList().subscribe((data) => {
      this.deliveries = data.data;
    });

    // Load dynamic quality rules and initialize form model
    this.qcService.getAllRules().subscribe((rules) => {
      // Add index to each rule
      this.qualityRules = rules.data.map((rule, idx) => ({
        ...rule,
        index: idx
      }));

      // Initialize the value map using ruleKey
      this.qualityRules.forEach((rule) => {
        this.qualityControlResult[rule.ruleKey] = 0;
      });
    });
  }
  ngAfterViewInit(): void {
    // Lier le paginator à la source de données après l'initialisation
    this.paginatorSource.paginator = this.paginator;
    this.paginatorSource.data = [...this.paginatorSource.data];

  }

  // Afficher le formulaire de contrôle qualité
  startQualityControl(reception: any): void {
    this.selectedReception = reception;
    this.currentView = 'form';
    // Initialiser les champs du formulaire en fonction du type de réception
    if (this.selectedReception.type === 'Huile') {
      this.formFields = {
        acidity: null,
        humidity: null,
        impurities: null,
        peroxideIndex: null,
        waxes: null
      };
    } else if (this.selectedReception.type === 'Olive') {
      this.formFields = {
        oliveCondition: null,
        acceptanceStatus: null
      };
    }
  }

  updateDelivery(): void {
    if (!this.selectedDeliveryId) {
      alert('Veuillez sélectionner une livraison.');
      return;
    }

    const selectedDelivery = this.deliveries.find((d) => d.id === this.selectedDeliveryId);

    if (!selectedDelivery) {
      alert('Livraison sélectionnée introuvable.');
      return;
    }

    // Map into QualityControlResultDto[] with full rule object
    selectedDelivery.qualityControlResults = this.qualityRules.map((rule) => ({
      ruleId: rule,
      measuredValue: this.qualityControlResult[rule.ruleKey]
    }));

    this.deliveryService.updateDelivery(selectedDelivery).subscribe({
      next: () => alert('Contrôle qualité enregistré avec succès.'),
      error: () => alert("Erreur lors de l'enregistrement des données.")
    });
  }

  /*
  *  */
  // Retourner au tableau
  backToTable(): void {
    this.currentView = 'table';
    this.selectedReception = null;
    this.formFields = {};
  }
  // Soumettre le formulaire de contrôle qualité
  submitForm(): void {
    console.log('Formulaire soumis :', this.formFields);

    // Enregistrer les données de contrôle qualité
    this.selectedReception.qualityControlData = { ...this.formFields };
    this.selectedReception.qualityControlDone = true;

    // Rafraîchir la source de données
    this.paginatorSource.data = [...this.paginatorSource.data];

    // Retourner au tableau
    this.backToTable();

    alert('Contrôle qualité validé avec succès !');
  }

  // Action : Consulter les détails d'une réception
  viewDetails(reception: any): void {
    this.selectedReception = reception;
    this.currentView = 'details';
  }
  deleteReception(reception:any){}
}
