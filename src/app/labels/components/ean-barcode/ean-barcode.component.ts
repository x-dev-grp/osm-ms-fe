import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import JsBarcode from 'jsbarcode';

import { isValidEan13 } from '../../utils/label-compliance.util';

@Component({
  selector: 'app-ean-barcode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ean-barcode.component.html',
  styleUrls: ['./ean-barcode.component.scss']
})
export class EanBarcodeComponent implements OnChanges, AfterViewInit {
  @Input() value?: string | null;
  @Input() size: 'compact' | 'miniature' | 'full' = 'miniature';
  @Input() showValue = true;

  @ViewChild('barcodeSvg') private barcodeSvg?: ElementRef<SVGSVGElement>;

  isValid = false;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderBarcode();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.isValid = isValidEan13(this.value);
    this.renderBarcode();
  }

  private renderBarcode(): void {
    const svg = this.barcodeSvg?.nativeElement;
    if (!svg || !this.viewReady) {
      return;
    }

    svg.innerHTML = '';
    const code = this.value?.trim() ?? '';
    if (!isValidEan13(code)) {
      this.isValid = false;
      return;
    }

    this.isValid = true;
    const options = this.resolveOptions();

    try {
      JsBarcode(svg, code, {
        format: 'EAN13',
        displayValue: this.showValue,
        font: 'monospace',
        fontOptions: 'bold',
        textAlign: 'center',
        textMargin: 2,
        margin: 0,
        ...options
      });
    } catch {
      this.isValid = false;
      svg.innerHTML = '';
    }
  }

  private resolveOptions(): { width: number; height: number; fontSize: number } {
    switch (this.size) {
      case 'full':
        return { width: 1.8, height: 72, fontSize: 14 };
      case 'compact':
        return { width: 1.3, height: 44, fontSize: 11 };
      case 'miniature':
      default:
        return { width: 1.1, height: 34, fontSize: 9 };
    }
  }
}
