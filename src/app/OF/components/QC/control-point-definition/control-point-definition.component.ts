import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from 'src/app/shared/services/toast.service';
import { OFService } from '../../../services/OFService';
import { QCControlPoint, ControlType } from '../../../models/QCControlPoint.model';
import { QCPlan } from '../../../models/QCPlan.model';
import { OrdreFabrication } from '../../../models/of.model';
import {ActivatedRoute, Router} from '@angular/router';
import { SharedModule } from "../../../../shared/shared.module";
import { QualityService } from "../../../services/QualityService";

@Component({
  selector: 'app-control-point-definition',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    SharedModule
  ],
  templateUrl: './control-point-definition.component.html',
  styleUrls: ['./control-point-definition.component.scss']
})
export class ControlPointDefinitionComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  selectedOfId: string | null = null;
  plan: QCPlan | null = null;
  points: QCControlPoint[] = [];
  pointForm: FormGroup;
  displayedColumns = ['nom', 'type', 'min', 'max', 'blocking', 'actions'];
  controlTypes = Object.values(ControlType);
  numericType = ControlType.NUMERIC;
  showCreatePlanModal = false;
  newPlanTitle = '';

  @ViewChild('pointDialog') pointDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private qualityService: QualityService,
    private ofService: OFService,
    private toast: ToastService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.pointForm = this.fb.group({
      nom: ['', Validators.required],
      type: [ControlType.NUMERIC, Validators.required],
      minValue: [null],
      maxValue: [null],
      blocking: [false]
    });
  }

  ngOnInit(): void {
    this.loadOFs();
    this.route.queryParams.subscribe(params => {
      const ofId = params['ofId'];
      if (ofId) {
        this.selectedOfId = ofId;
        this.loadPlanWhenReady();
      }
    });
  }

  private loadPlanWhenReady(): void {
    if (this.ofs.length > 0) {
      this.loadPlan();
    } else {
      const sub = this.ofService.getAll().subscribe({
        next: (data) => {
          this.ofs = data || [];
          sub.unsubscribe();
          this.loadPlan();
        },
        error: () => this.toast.error('Erreur chargement OF')
      });
    }
  }

  loadOFs(): void {
    this.ofService.getAll().subscribe({
      next: (data: OrdreFabrication[]) => {
        this.ofs = data || [];
      },
      error: () => this.toast.error('Erreur chargement OF')
    });
  }

  onOfSelected(): void {
    if (!this.selectedOfId) return;
    this.loadPlan();
  }

  loadPlan(): void {
    if (!this.selectedOfId) return;
    this.qualityService.getPlanByOfId(this.selectedOfId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.plan = res.data as QCPlan;
          this.loadPoints();
        } else {
          this.plan = null;
          this.points = [];
        }
      },
      error: () => {
        this.plan = null;
        this.points = [];
      }
    });
  }

  loadPoints(): void {
    if (!this.plan) return;
    this.qualityService.getPointsForOF(this.selectedOfId!).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.points = res.data as QCControlPoint[] || [];
        }
      },
      error: () => (this.points = [])
    });
  }

  openCreatePlanModal(): void {
    this.showCreatePlanModal = true;
  }

  createPlanWithTitle(): void {
    if (!this.newPlanTitle.trim()) {
      this.toast.warning('Veuillez saisir un titre');
      return;
    }
    this.qualityService.createPlan(this.selectedOfId!, this.newPlanTitle.trim()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.plan = res.data as QCPlan;
          this.toast.success('Plan créé');
          this.loadPoints();
          this.cancelCreatePlan();
        } else {
          this.toast.error(res.message);
        }
      },
      error: () => this.toast.error('Erreur lors de la création')
    });
  }

  cancelCreatePlan(): void {
    this.showCreatePlanModal = false;
    this.newPlanTitle = '';
  }

  addPoint(): void {
    this.pointForm.reset({
      nom: '',
      type: ControlType.NUMERIC,
      minValue: null,
      maxValue: null,
      blocking: false
    });
    this.dialog.open(this.pointDialog);
  }

  savePoint(): void {
    if (!this.plan) return;

    const rawValue = this.pointForm.value;
    const pointData: any = { ...rawValue };

    if (pointData.type !== ControlType.NUMERIC) {
      delete pointData.minValue;
      delete pointData.maxValue;
    }

    console.log('Payload envoyé au backend :', pointData);

    this.qualityService.addControlPoint(this.plan.id!, pointData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.points = [...this.points, res.data as QCControlPoint];
          this.toast.success('Point ajouté');
          this.dialog.closeAll();
        } else {
          this.toast.error(res.message);
        }
      },
      error: (err) => {
        console.error('Erreur complète :', err);
        this.toast.error('Erreur lors de l\'ajout');
      }
    });
  }

  removePoint(index: number): void {
    const point = this.points[index];
    if (!point.id) return;

    if (confirm('Supprimer définitivement ce point de contrôle ?')) {
      this.qualityService.deleteControlPoint(point.id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.points = this.points.filter((_, i) => i !== index);
            this.toast.success('Point supprimé');
          } else {
            this.toast.error(res.message || 'Erreur lors de la suppression');
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }
  goToQualityEntry(): void {
    if (!this.selectedOfId) {
      this.toast.warning('Veuillez sélectionner un OF');
      return;
    }
    this.router.navigate(['/of/qualite/entry'], {
      queryParams: { ofId: this.selectedOfId }
    });
  }
  goToOFDetail(): void {
    if (!this.selectedOfId) {
      this.toast.warning('Aucun OF sélectionné');
      return;
    }
    this.router.navigate(['/of/', this.selectedOfId]);
  }

}
