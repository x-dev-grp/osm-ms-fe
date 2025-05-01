
import { CommonModule } from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {QualityControlRuleService} from "../../../shared/services/quality-control-rule.service";
import {QualityControlRule} from "../../../shared/models/quality-control-rule";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
   FormControl
} from "@angular/forms";
import { ActivatedRoute } from '@angular/router';
import {UnifiedDeliveryService} from "../../../shared/services/delivery.service";
import {UnifiedDelivery} from "../../../shared/models/UnifiedDelivery";



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
  receptionId!: string | null;
  deliveryData!: UnifiedDelivery;
  private deliveryType: "OLIVE" | "OIL";

  constructor(
    private fb: FormBuilder,
    private qcService: QualityControlRuleService,
    private route: ActivatedRoute,
    private deliveryService: UnifiedDeliveryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.receptionId = this.route.snapshot.paramMap.get('id');
    if (!this.receptionId) {
      this.message = 'ID de réception manquant.';
      return;
    }
    this.loadReception();
  }

  loadReception(): void {
    this.deliveryService.getUnifiedDelivery(this.receptionId!).subscribe({
      next: (response) => {
        if (!response?.data || response.data.length === 0) {
          this.message = 'Aucune donnée de livraison trouvée.';
          return;
        }
        this.deliveryData = response.data[0];
        this.deliveryType = this.deliveryData.deliveryType as 'OLIVE' | 'OIL';
        console.log('Type de livraison:', this.deliveryType);
        console.log(this.deliveryData)
        // Charger les règles après avoir récupéré le type de livraison
        this.loadRules();
      },
      error: (error) => {
        this.handleError(error, 'Erreur lors du chargement de la réception.');
      }
    });
  }

  createDynamicForm(): void {
    const filteredRules = this.filterRulesByDeliveryType(this.deliveryType);

    const group: { [key: string]: FormControl } = {};
    filteredRules.forEach((rule) => {
      const validators = [];

      if (rule.minValue !== undefined) validators.push(Validators.min(rule.minValue));
      if (rule.maxValue !== undefined) validators.push(Validators.max(rule.maxValue));

      group[rule.ruleKey] = new FormControl('', validators);
    });

    this.dynamicForm = this.fb.group(group);
  }

  filterRulesByDeliveryType(deliveryType: 'OLIVE' | 'OIL'): QualityControlRule[] {
    return this.rules.filter(rule =>
      deliveryType === 'OLIVE' ? !rule.oilQc : rule.oilQc
    );
  }

  loadRules(): void {
    this.qcService.getAllRules().subscribe({
      next: (res) => {
        if (res?.success) {
          this.rules = Array.isArray(res.data) && Array.isArray(res.data[0])
            ? res.data[0]
            : res.data;
          console.log("resss",res)


          this.createDynamicForm();
          this.cdr.detectChanges();
        } else {
          this.rules = [];
          this.message = res.message || 'Aucune règle trouvée.';
        }
      },
      error: () => {
        this.rules = [];
        this.message = 'Erreur de chargement des règles.';
      }
    });
  }

  handleError(error: any, defaultMessage: string): void {
    console.error(defaultMessage, error);
    this.message = error?.message || defaultMessage;
  }
  onSubmit(): void {
    if (this.dynamicForm.invalid) {
      this.message = 'Le formulaire est invalide.';
      return;
    }

    // Récupérer les valeurs du formulaire
    const formValues = this.dynamicForm.value;

    // Créer l'objet controleQualite
    const controleQualite = {
      ...this.deliveryData, // Inclure toutes les données de la livraison
      controlQualite: formValues // Ajouter les valeurs du formulaire
    };

    console.log('Objet controleQualite soumis:', controleQualite);

    // Envoyer l'objet au backend (exemple)
    // this.qcService.submitControleQualite(controleQualite).subscribe({
    //   next: (response) => {
    //     console.log('Contrôle qualité soumis avec succès:', response);
    //   },
    //   error: (error) => {
    //     this.handleError(error, 'Erreur lors de la soumission du contrôle qualité.');
    //   }
    // });
  }

}
