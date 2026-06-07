import { AfterViewInit, Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { SKUService } from '../../../services/sku.service';
import {
  ProductType,
  SKU,
  productCartonsPerPallet,
  productDisplayName,
  productTypeLabel,
  productUnitsPerCarton
} from '../../../models/sku.model';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  ConfirmationDialogService,
  ConfirmationType
} from '../../../../shared/services/confirmation-dialog.service';

@Component({
  selector: 'app-sku-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './sku-list.component.html',
  styleUrls: ['./sku-list.component.scss']
})
export class SkuListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<SKU>([]);

  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  categoryFilter = signal<string>('');
  typeFilter = signal<ProductType | ''>('');
  togglingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);

  readonly productTypes: ProductType[] = ['VRAC', 'NON_VRAC'];
  displayedColumns: string[] = ['status', 'code', 'name', 'type', 'category', 'packaging', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private readonly skuService: SKUService,
    private readonly toast: ToastService,
    private readonly confirmationDialog: ConfirmationDialogService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadSkus();

    this.dataSource.filterPredicate = (data: SKU, filter: string) => {
      const searchObj = JSON.parse(filter) as {
        term: string;
        category: string;
        type: ProductType | '';
      };

      const term = searchObj.term.toLowerCase();
      const matchesTerm = !term ||
        productDisplayName(data).toLowerCase().includes(term) ||
        (data.code || '').toLowerCase().includes(term) ||
        (data.category || '').toLowerCase().includes(term) ||
        (data.grade || '').toLowerCase().includes(term) ||
        (data.brand || '').toLowerCase().includes(term) ||
        (data.barcode || '').toLowerCase().includes(term);

      const matchesCategory = !searchObj.category || data.category === searchObj.category;
      const matchesType = !searchObj.type || data.type === searchObj.type;

      return matchesTerm && matchesCategory && matchesType;
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadSkus(): void {
    this.loading.set(true);

    this.skuService.getAllProducts().subscribe({
      next: (data) => {
        const sorted = [...(data ?? [])].sort((a, b) => {
          if (a.actif !== b.actif) {
            return a.actif ? -1 : 1;
          }
          const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          return dateB - dateA;
        });

        this.dataSource.data = sorted;
        this.loading.set(false);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.toast.error('Impossible de charger la liste des produits');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      term: this.searchTerm(),
      category: this.categoryFilter(),
      type: this.typeFilter()
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.applyFilters();
  }

  onCategoryChange(value: string): void {
    this.categoryFilter.set(value);
    this.applyFilters();
  }

  onTypeChange(value: ProductType | ''): void {
    this.typeFilter.set(value);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.typeFilter.set('');
    this.applyFilters();
  }

  toActif(sku: SKU): void {
    if (!sku.id) {
      return;
    }

    const isCurrentlyActif = sku.actif === true;
    const action = isCurrentlyActif ? 'desactiver' : 'activer';

    this.confirmationDialog.confirm({
      title: 'Confirmation',
      message: `Voulez-vous vraiment ${action} le produit "${productDisplayName(sku)}" ?`,
      type: ConfirmationType.WARNING,
      confirmText: isCurrentlyActif ? 'Desactiver' : 'Activer',
      cancelText: 'Annuler',
      showIcon: true,
      destructive: isCurrentlyActif
    }).subscribe((result) => {
      if (!result?.confirmed) {
        return;
      }

      this.togglingId.set(sku.id!);

      const request = isCurrentlyActif
        ? this.skuService.desactiverSku(sku.id!)
        : this.skuService.activerSku(sku.id!);

      request.subscribe({
        next: () => {
          const updated = this.dataSource.data.map((item) =>
            item.id === sku.id ? { ...item, actif: !isCurrentlyActif } : item
          ).sort((a, b) => {
            if (a.actif !== b.actif) {
              return a.actif ? -1 : 1;
            }
            const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
            const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
            return dateB - dateA;
          });

          this.dataSource.data = updated;
          this.applyFilters();
          this.toast.success(`Produit ${isCurrentlyActif ? 'desactive' : 'active'} avec succes`);
          this.togglingId.set(null);
        },
        error: (err) => {
          console.error('Erreur changement statut produit:', err);
          this.togglingId.set(null);
        }
      });
    });
  }

  deleteSku(sku: SKU): void {
    if (!sku.id) {
      return;
    }

    this.confirmationDialog.confirmDelete(
      productDisplayName(sku),
      `Voulez-vous vraiment supprimer le produit "${productDisplayName(sku)}" ?`
    ).subscribe((result) => {
      if (!result?.confirmed) {
        return;
      }

      this.deletingId.set(sku.id!);

      this.skuService.deleteSku(sku.id!).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter((item) => item.id !== sku.id);
          this.applyFilters();
          this.toast.success('Produit supprime avec succes');
          this.deletingId.set(null);
        },
        error: (err) => {
          console.error('Erreur suppression produit:', err);
          this.deletingId.set(null);
        }
      });
    });
  }

  totalCount(): number {
    return this.dataSource.data.length;
  }

  activeCount(): number {
    return this.dataSource.data.filter((row) => row.actif).length;
  }

  bulkCount(): number {
    return this.dataSource.data.filter((row) => row.type === 'VRAC').length;
  }

  getCategories(): string[] {
    return [...new Set(
      this.dataSource.data
        .map((sku) => sku.category)
        .filter((value): value is string => !!value)
    )].sort((a, b) => a.localeCompare(b));
  }

  getProductName(sku: SKU): string {
    return productDisplayName(sku);
  }

  formatProductType(type?: ProductType): string {
    return productTypeLabel(type);
  }

  packagingSummary(sku: SKU): string {
    if (sku.type === 'VRAC') {
      return [sku.unitOfMeasure, sku.density ? `densite ${sku.density}` : '', sku.storageUnit]
        .filter(Boolean)
        .join(' / ') || '-';
    }

    const unitsPerCarton = productUnitsPerCarton(sku);
    const cartonsPerPallet = productCartonsPerPallet(sku);

    return [
      sku.volume ? `${sku.volume} ml` : '',
      sku.packagingType || '',
      unitsPerCarton ? `${unitsPerCarton} u/carton` : '',
      cartonsPerPallet ? `${cartonsPerPallet} c/palette` : ''
    ].filter(Boolean).join(' / ') || '-';
  }
}
