import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { SharedModule } from '../../../../demo/shared/shared.module';
import { MillMachine } from '../../../../shared/models/millMachine';
import { MillMachineService } from '../../../../shared/services/mill-machine.service';

@Component({
  selector: 'app-mill-machine-view',
  templateUrl: './mill-machine-view.component.html',
  styleUrls: ['./mill-machine-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SharedModule
  ]
})
export class MillMachineViewComponent implements OnInit {
  machine: MillMachine | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private service: MillMachineService,
    private snackBar: MatSnackBar,
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
        this.machine = machine.data[0];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la machine :', err);
        this.error = 'Erreur lors du chargement de la machine';
        this.loading = false;
        this.toast('Erreur lors du chargement de la machine');
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

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
