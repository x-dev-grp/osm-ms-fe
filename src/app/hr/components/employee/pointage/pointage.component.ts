import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { Pointage, PointageStatus } from '../../../model/pointage.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Employee } from '../../../model/employee-model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { EmployeeService } from '../../../services/employee-service';
import { PointageService } from '../../../services/pointage-service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    NgClass,
    MatIconModule,
    MatSnackBarModule,
    MatTooltip
  ],
  templateUrl: './pointage.component.html',
  styleUrl: './pointage.component.scss'
})
export class PointageComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['employee', 'checkIn', 'checkOut', 'pointageDuree', 'status', 'action'];

  dataSource = new MatTableDataSource<Employee>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  selectedDate: Date = new Date();

  constructor(
    private snackBar: MatSnackBar,
    private employeeServices: EmployeeService,
    private pointageService: PointageService
  ) {}

  ngOnInit(): void {
    console.log('PointageComponent initialisé ✅');
    this.getListeEmployee();
  }

  getListeEmployee(): void {
    this.employeeServices.getAllEmployees().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Assurer que response.data est bien un tableau
          let employees: any;
          if (Array.isArray(response.data)) {
            employees = response.data;
          } else {
            employees = response.data[0];
          }

          // Traiter chaque employé pour s'assurer qu'il a un pointage pour la date sélectionnée
          employees.forEach((employee: Employee) => {
            this.ensureCurrentDayPointage(employee);
          });

          this.dataSource.data = employees;
          console.log('Employés chargés :', this.dataSource.data);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés :', error);
        this.snackBar.open('Erreur lors du chargement des employés', 'Fermer', { duration: 3000 });
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: Employee, filter: string) =>
      data.firstName?.toLowerCase().includes(filter) || data.lastName?.toLowerCase().includes(filter);
    this.dataSource.filter = filterValue;
  }

  onDateChange(date: Date) {
    this.selectedDate = date;
    console.log('Date choisie :', date);

    // Recharger les données avec la nouvelle date
    if (this.dataSource.data.length > 0) {
      this.dataSource.data.forEach((employee) => {
        this.ensureCurrentDayPointage(employee);
      });
      // Forcer la mise à jour du tableau
      this.dataSource.data = [...this.dataSource.data];
    }
  }

  // S'assurer qu'un employé a un pointage pour le jour sélectionné
  private ensureCurrentDayPointage(employee: Employee): Employee {
    const currentDateStr = this.formatDate(this.selectedDate);

    // Vérifier si l'employé a déjà un pointage pour cette date
    const existingPointage = employee.pointages?.find((p) => p.date === currentDateStr);

    if (!existingPointage) {
      // Créer un nouveau pointage pour cette date
      if (!employee.pointages) {
        employee.pointages = [];
      }
      employee.pointages.push({
        date: currentDateStr,
        checkIn: '',
        checkOut: '',
        pointageDuree: '',
        status: PointageStatus.ABSENT
      });
    }

    return employee;
  }

  // Obtenir le pointage du jour sélectionné pour un employé
  private getCurrentDayPointage(employee: Employee): Pointage | null {
    const currentDateStr = this.formatDate(this.selectedDate);
    return employee.pointages?.find((p) => p.date === currentDateStr) || null;
  }

  // Marquer l'heure d'entrée
  marqueeEntree(employee: Employee) {
    const currentTime = this.getCurrentTime();
    const pointage = this.getCurrentDayPointage(employee);

    if (!pointage) {
      this.snackBar.open('Erreur: Pointage non trouvé', 'Fermer', { duration: 3000 });
      return;
    }

    // Mise à jour de l'heure d'entrée
    pointage.checkIn = currentTime;
    pointage.status = PointageStatus.PRESENT;

    // Si une heure de sortie existe, recalculer la durée
    if (pointage.checkOut) {
      pointage.pointageDuree = this.calculateDuration(pointage.checkIn, pointage.checkOut);
    }

    // Rafraîchir le tableau
    this.dataSource.data = [...this.dataSource.data];

    // Notification
    this.snackBar.open(`Entrée marquée à ${currentTime} pour ${employee.firstName} ${employee.lastName}`, 'Fermer', { duration: 3000 });

    console.log('Entrée marquée :', employee, pointage);
    this.pointageService.markEntry(employee.id!, new Date(), pointage.checkIn);
  }

  // Marquer l'heure de sortie
  marqueesortie(employee: Employee) {
    const currentTime = this.getCurrentTime();
    const pointage = this.getCurrentDayPointage(employee);

    if (!pointage) {
      this.snackBar.open('Erreur: Pointage non trouvé', 'Fermer', { duration: 3000 });
      return;
    }

    // Vérifier si une heure d'entrée existe
    if (!pointage.checkIn) {
      this.snackBar.open("Veuillez d'abord marquer l'entrée !", 'Fermer', { duration: 3000 });
      return;
    }

    // Mise à jour de l'heure de sortie
    pointage.checkOut = currentTime;
    pointage.pointageDuree = this.calculateDuration(pointage.checkIn, pointage.checkOut);

    // Rafraîchir le tableau
    this.dataSource.data = [...this.dataSource.data];

    // Notification
    this.snackBar.open(`Sortie marquée à ${currentTime} pour ${employee.firstName} ${employee.lastName}`, 'Fermer', { duration: 3000 });

    console.log('Sortie marquée :', employee, pointage);
  }

  // Obtenir l'heure actuelle au format HH:MM
  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Formater la date au format YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculer la durée entre deux heures
  private calculateDuration(checkIn: string, checkOut: string): string {
    try {
      const [inHours, inMinutes] = checkIn.split(':').map(Number);
      const [outHours, outMinutes] = checkOut.split(':').map(Number);

      const inTotalMinutes = inHours * 60 + inMinutes;
      const outTotalMinutes = outHours * 60 + outMinutes;

      // Gérer le cas où la sortie est le lendemain
      let diffMinutes = outTotalMinutes - inTotalMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Ajouter 24h en minutes
      }

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return minutes > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${hours}h`;
    } catch (error) {
      console.error('Erreur calcul durée:', error);
      return '0h';
    }
  }

  // Vérifier si un employé peut marquer son entrée
  canMarkEnter(employee: Employee): boolean {
    const pointage = this.getCurrentDayPointage(employee);
    // Peut marquer l'entrée si pas encore d'heure d'entrée enregistrée
    return pointage ? pointage.checkIn !== null && pointage.checkIn !== '' : false;
  }

  // Vérifier si un employé peut marquer sa sortie
  canMarkExit(employee: Employee): boolean {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage ? pointage.checkIn !== null && pointage.checkIn !== '' : false;
  }

  // Vérifier si un employé a déjà marqué sa sortie
  hasMarkedExit(employee: Employee): boolean {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage ? pointage.checkOut !== null && pointage.checkOut !== '' : false;
  }

  // Obtenir l'heure d'entrée pour l'affichage
  getCheckInTime(employee: Employee): string {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage?.checkIn || '';
  }

  // Obtenir l'heure de sortie pour l'affichage
  getCheckOutTime(employee: Employee): string {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage?.checkOut || '';
  }

  // Obtenir la durée pour l'affichage
  getDuration(employee: Employee): string {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage?.pointageDuree || '';
  }

  // Obtenir le statut pour l'affichage
  getStatus(employee: Employee): PointageStatus {
    const pointage = this.getCurrentDayPointage(employee);
    return pointage?.status || PointageStatus.ABSENT;
  }
}
