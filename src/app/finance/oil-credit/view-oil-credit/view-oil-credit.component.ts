import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
 import { ActivatedRoute, Router, RouterLink } from '@angular/router';
 import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { OilCredit } from '../../models/OilCredit';
import { OilCreditService } from '../../service/oil-credit.service';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatLine } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-oil-credit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink,
    CardComponent,
    MatCardActions,
    MatListItem,
    MatCardContent,
    MatList,
    MatCardHeader,
    MatCard,
    MatLine,
    MatTooltip
  ],
  templateUrl: './view-oil-credit.component.html',
  styleUrls: ['./view-oil-credit.component.scss']
})
export class ViewOilCreditComponent implements OnInit {
  credit?: OilCredit;
  storageUnitName?: string;
  private svc = inject(OilCreditService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storageSvc = inject(StorageUnitDtoService);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Fetch only the credit first
      this.svc.getOilCredit(id).subscribe((res) => {
        this.credit = res.data[0];
        // Then fetch only the used storage unit
        const pileId = this.credit?.citerne_pile;
        if (pileId) {
          this.storageSvc.getStorageUnit(pileId).subscribe((u) => {
            this.storageUnitName = u.data[0].name;
          });
        }
      });
    }
  }

  getStorageUnitName(): string {
    // Return the fetched name or fallback to ID
    return this.storageUnitName || this.credit?.citerne_pile || '';
  }
  navigateToStorageUnits(): void {
    this.router.navigate(['/settings/storage']);
  }

  onBack(): void {
    this.router.navigate(['/finance/oil-credit']);
  }

  onPrint(): void {
    window.print();
  }
}
