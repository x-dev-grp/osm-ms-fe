import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { QualityControlRuleService } from "../../../shared/services/quality-control-rule.service";
import { QualityControlRule } from "../../../shared/models/quality-control-rule";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl
} from "@angular/forms";
import { ActivatedRoute } from '@angular/router';
import { UnifiedDeliveryService } from "../../../shared/services/delivery.service";
import { UnifiedDelivery } from "../../../shared/models/UnifiedDelivery";

@Component({
  selector: 'app-controleQualite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './controleQualite.component.html',
  styleUrl: './controleQualite.component.scss',
  standalone: true
})
export class ControleQualiteComponent implements OnInit {
  message: string = '';
  rules: QualityControlRule[] = [];
  dynamicForm!: FormGroup;
  receptionId: string | null = null;
  deliveryData: UnifiedDelivery | null = null;

  constructor(
    private fb: FormBuilder,
    private qcService: QualityControlRuleService,
    private route: ActivatedRoute,
    private deliveryService: UnifiedDeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    this.loadReception();
  }

  loadReception(): void {
    if (!this.receptionId) {
      this.message = 'ID de réception manquant';
      return;
    }

    this.deliveryService.getUnifiedDelivery(this.receptionId).subscribe({
      next: (response) => {
        this.deliveryData = Array.isArray(response.data) ? response.data[0] : response.data;
        console.log('Delivery Data:', this.deliveryData);
        this.loadRules(); // Load rules after delivery data is available
      },
      error: (error) => {
        console.error('Erreur réception:', error);
        this.message = 'Erreur lors du chargement des données de réception';
        this.cdr.detectChanges();
      }
    });
  }

  loadRules(): void {
    this.qcService.getAllRules().subscribe({
      next: (res) => {
        if (res?.success) {
          // Normalize rules data to always be an array
          let allRules: QualityControlRule[] = [];

          if (Array.isArray(res.data)) {
            allRules = Array.isArray(res.data[0]) ? res.data[0] : res.data;
          } else {
            // If res.data is not an array, wrap it as a single-element array
            allRules = res.data ? [res.data] : [];
          }

          // Filter rules based on deliveryType
          this.rules = this.filterRules(allRules);
          console.log('Filtered Rules:', this.rules);

          // Create dynamic form only if rules exist
          if (this.rules.length > 0) {
            this.createDynamicForm();
          } else {
            this.message = 'Aucune règle applicable trouvée pour ce type de livraison';
          }

          this.cdr.detectChanges();
        } else {
          this.rules = [];
          this.message = res.message || 'Aucune règle trouvée';
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Erreur chargement règles:', error);
        this.rules = [];
        this.message = 'Erreur lors du chargement des règles';
        this.cdr.detectChanges();
      }
    });
  }

  private filterRules(allRules: QualityControlRule[]): QualityControlRule[] {
    if (!this.deliveryData?.deliveryType) {
      return [];
    }

    switch (this.deliveryData.deliveryType) {
      case 'OIL':
        return allRules.filter(rule => rule.oilQc === true);
      case 'OLIVE':
        return allRules.filter(rule => rule.oilQc === false || rule.oilQc === null);
      default:
        return [];
    }
  }

  createDynamicForm(): void {
    const group: { [key: string]: FormControl } = {};

    this.rules.forEach((rule) => {
      // Use empty string as default if oilQc is undefined
      const value = rule.oilQc !== undefined ? rule.oilQc : '';
      const validators = [];

      // Add validators only if defined
      if (rule.minValue !== undefined && rule.minValue !== null) {
        validators.push(Validators.min(rule.minValue));
      }
      if (rule.maxValue !== undefined && rule.maxValue !== null) {
        validators.push(Validators.max(rule.maxValue));
      }

      group[rule.ruleKey] = new FormControl(value, validators);
    });

    this.dynamicForm = this.fb.group(group);
  }

  onSubmit(): void {
    // Vérifier si le formulaire est valide
    if (this.dynamicForm.invalid) {
      this.message = 'Le formulaire contient des erreurs. Veuillez corriger les champs.';
      return;
    }
    // Récupérer les valeurs du formulaire
    const formValues = this.dynamicForm.value;
    // Créer l'objet qualityControl
    const qualityControl: { [key: string]: any } = {};
    Object.keys(formValues).forEach((ruleName) => {
      qualityControl[ruleName] = formValues[ruleName];
    });

    // Afficher les données pour vérification
    console.log('Quality Control:', qualityControl);

    // Vérifier si deliveryData existe
    if (!this.deliveryData) {
      this.message = 'Données de livraison non disponibles.';
      return;
    }

    // Mettre à jour l'objet UnifiedDelivery avec le nouveau qualityControl
    const updatedDeliveryData = {
      ...this.deliveryData, // Copier les données existantes
      qualityControl: qualityControl, // Ajouter ou remplacer le champ qualityControl
    };

    console.log('Updated Delivery Data:', updatedDeliveryData);

    //Envoyer les données mises à jour au backend
    this.deliveryService.updateDelivery(updatedDeliveryData).subscribe({
      next: (response) => {
        this.message = 'Contrôle qualité soumis avec succès.';
        console.log('Réponse du serveur:', response);
      },
      error: (error) => {
        console.error('Erreur lors de la soumission:', error);
        this.message = 'Erreur lors de la soumission du contrôle qualité.';
      },
    });
  }
}
