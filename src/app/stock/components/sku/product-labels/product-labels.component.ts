import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { LabelService } from '../../../../labels/services/label.service';
import { LabelContentDto } from '../../../../labels/models/label.model';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product-labels',
  standalone: true,
  imports: [TranslateModule, CommonModule, RouterModule],
  templateUrl: './product-labels.component.html',
  styleUrls: ['./product-labels.component.scss']
})
export class ProductLabelsComponent implements OnChanges {
  @Input() productId?: string;

  labels$: Observable<LabelContentDto[]> = of([]);

  constructor(private readonly labelService: LabelService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('productId' in changes) {
      this.loadLabels();
    }
  }

  private loadLabels(): void {
    if (this.productId) {
      this.labels$ = this.labelService.getByProductId(this.productId);
    } else {
      this.labels$ = of([]);
    }
  }
}
