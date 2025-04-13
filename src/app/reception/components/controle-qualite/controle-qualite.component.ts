import { Component, OnInit } from '@angular/core';
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
export class ControleQualiteComponent implements OnInit {
  deliveries: Delivery[] = [];
  selectedDeliveryId: string | null = null;

  qualityRules: QualityControlRule[] = [];
  qualityControlResult: Record<string, number> = {}; // Same as {[key: string]: number}
  protected readonly Object = Object;

  constructor(
    private qcService: QualityControlRuleService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
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
}
