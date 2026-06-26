import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { MillMachine } from '../../../shared/models/millMachine';
import { MillMachineService } from '../../../shared/services/mill-machine.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DashboardConfig } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { AdvancedSearchService } from '../../../shared/services/advanced-serach.service';
import { MACHIN_RECEPTION_DASHBOARD } from './MACHIN_RECEPTION_DASHBOARD';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { OosmDashboard } from '../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-mill-machine-view',
  templateUrl: './mill-machine-view.component.html',
  styleUrls: ['./mill-machine-view.component.scss'],
  standalone: true,
  imports: [TranslateModule, CommonModule, MatButtonModule, MatIconModule, SharedModule, OosmDashboard]
})
export class MillMachineViewComponent implements OnInit {
  machine: MillMachine;
  loading = false;
  error: string | null = null;

  /** Search/dashboard config you already use */
  receptions: DashboardConfig = MACHIN_RECEPTION_DASHBOARD;

  machinId: string | null;
  destroyRef = inject(DestroyRef);

  /** Raw list coming from the search endpoint (used by mat-table in the HTML) */
  receptionslist: UnifiedDelivery[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // Optional: generic table config (so you can also render with your shared table)
  // Usage (if desired): <osm-table [config]="deliveriesTable"></osm-table>
  // ─────────────────────────────────────────────────────────────────────────────

  constructor(
    private service: MillMachineService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private searchService: AdvancedSearchService
  ) {}

  ngOnInit(): void {
    this.machinId = this.route.snapshot.paramMap.get('id');
    if (this.machinId) {
      this.loadMachine(this.machinId);
      this.loadRelatedRecaptions();
    }
  }

  // Data loading (unchanged except we also sync the table config)
  loadRelatedRecaptions(): void {
    this.receptions = {
      ...this.receptions,
      defaultSearchData: {
        ...this.receptions.defaultSearchData,
        searchData: {
          ...this.receptions.defaultSearchData?.searchData,
          search: {
            isDeleted: { equalValue: false },
            ...this.receptions.defaultSearchData?.searchData?.search,
            'millMachine.id': { equalValue: this.machinId }
          }
        }
      }
    };

    this.searchService
      .search(this.receptions, 'production/deliveries')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((res) => {
          this.receptionslist = res?.data ?? [];
          console.log('[deliveries] count:', this.receptionslist.length);
        })
      )
      .subscribe();
  }

  editMachine(): void {
    if (this.machine?.id) {
      this.router.navigate(['/reception/mill-machines/edit', this.machine.id]);
    }
  }

  private loadMachine(id: string): void {
    this.loading = true;
    this.error = null;

    this.service.getMillMachine(id).subscribe({
      next: (machine) => {
        this.machine = Array.isArray(machine.data) ? machine.data[0] : machine.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la machine :', err);
        this.error = 'Erreur lors du chargement de la machine';
        this.loading = false;
        this.toastService.error('Failed to load machine details');
      }
    });
  }
}
