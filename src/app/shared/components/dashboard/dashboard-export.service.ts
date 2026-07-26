import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../services/toast.service';
import {
  DashboardExportFormat,
  DashboardExportPayload,
  hasExportableData
} from './dashboard-export.models';

@Injectable({ providedIn: 'root' })
export class DashboardExportService {
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  async export(payload: DashboardExportPayload | null | undefined, format: DashboardExportFormat): Promise<void> {
    if (!hasExportableData(payload)) {
      this.toast.warning(this.translate.instant('DASHBOARD.EXPORT.NO_DATA'));
      return;
    }

    const safePayload = payload!;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const baseName = `${this.sanitizeFileName(safePayload.fileName)}-${stamp}`;

    try {
      switch (format) {
        case 'csv':
          this.exportCsv(safePayload, baseName);
          break;
        case 'excel':
          await this.exportExcel(safePayload, baseName);
          break;
        case 'pdf':
          this.exportPdf(safePayload, baseName);
          break;
      }
      this.toast.success(this.translate.instant('DASHBOARD.EXPORT.SUCCESS'));
    } catch (error) {
      console.error('Dashboard export failed', error);
      this.toast.error(this.translate.instant('DASHBOARD.EXPORT.ERROR'));
    }
  }

  private exportCsv(payload: DashboardExportPayload, baseName: string): void {
    const lines: string[] = [];

    for (const sheet of payload.sheets) {
      if (!sheet.rows.length) {
        continue;
      }
      lines.push(this.escapeCsv(sheet.name));
      lines.push(sheet.columns.map((col) => this.escapeCsv(col.label)).join(';'));
      for (const row of sheet.rows) {
        lines.push(sheet.columns.map((col) => this.escapeCsv(row[col.key])).join(';'));
      }
      lines.push('');
    }

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${baseName}.csv`);
  }

  private async exportExcel(payload: DashboardExportPayload, baseName: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ZitFlow';
    workbook.created = new Date();

    for (const sheet of payload.sheets) {
      if (!sheet.rows.length) {
        continue;
      }
      const worksheet = workbook.addWorksheet(this.sanitizeSheetName(sheet.name));
      worksheet.columns = sheet.columns.map((col) => ({
        header: col.label,
        key: col.key,
        width: Math.max(12, Math.min(40, col.label.length + 6))
      }));

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.commit();

      for (const row of sheet.rows) {
        const values: Record<string, string | number | boolean> = {};
        for (const col of sheet.columns) {
          values[col.key] = this.toCellValue(row[col.key]);
        }
        worksheet.addRow(values);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      `${baseName}.xlsx`
    );
  }

  private exportPdf(payload: DashboardExportPayload, baseName: string): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    let cursorY = 40;

    doc.setFontSize(14);
    doc.text(payload.title, 40, cursorY);
    cursorY += 18;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(new Date().toLocaleString(), 40, cursorY);
    doc.setTextColor(0);
    cursorY += 16;

    for (const sheet of payload.sheets) {
      if (!sheet.rows.length) {
        continue;
      }

      if (cursorY > 520) {
        doc.addPage();
        cursorY = 40;
      }

      doc.setFontSize(11);
      doc.text(sheet.name, 40, cursorY);
      cursorY += 8;

      autoTable(doc, {
        startY: cursorY,
        head: [sheet.columns.map((col) => col.label)],
        body: sheet.rows.map((row) => sheet.columns.map((col) => String(this.toCellValue(row[col.key])))),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [21, 101, 192] },
        margin: { left: 40, right: 40 }
      });

      cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY) + 24;
    }

    doc.save(`${baseName}.pdf`);
  }

  private toCellValue(value: string | number | boolean | null | undefined): string | number | boolean {
    if (value == null) {
      return '';
    }
    return value;
  }

  private escapeCsv(value: unknown): string {
    const text = value == null ? '' : String(value);
    if (/[;"\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  private sanitizeFileName(name: string): string {
    return (name || 'dashboard').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
  }

  private sanitizeSheetName(name: string): string {
    return (name || 'Sheet').replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31);
  }
}
