import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { SharedModule } from '../../../../demo/shared/shared.module';
import { MillMachine } from '../../../../shared/models/millMachine';
import { MillMachineService } from '../../../../shared/services/mill-machine.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-mill-machine-view',
  templateUrl: './mill-machine-view.component.html',
  styleUrls: ['./mill-machine-view.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, SharedModule]
})
export class MillMachineViewComponent implements OnInit {
  machine: MillMachine ;
  loading = false;
  error: string | null = null;

  constructor(
    private service: MillMachineService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMachine(id);
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

  editMachine(): void {
    if (this.machine?.id) {
      this.router.navigate(['/reception/mill-machines/edit', this.machine.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/reception/mill-machines']);
  }

  private toast(message: string): void {
    this.toastService.info(message);
  }
}
