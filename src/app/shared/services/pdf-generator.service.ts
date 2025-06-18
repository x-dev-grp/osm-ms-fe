import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';


@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  generatePdfDocument(config: {
    title: string;
    reference: string;
    date?: string;
    fields?: { label: string; value: string }[];
    generalInfo?: { label: string; value: string }[];
    footerInfo?: { label: string; placeholder?: string }[];
    fileName?: string;
  }): void {
    const logoPath = 'assets/images/logo.jpeg';

    this.getBase64ImageFromUrl(logoPath).then(base64Logo => {
      const doc = new jsPDF();
      let currentY = 10;

      const documentDate = config.date || new Date().toLocaleDateString();

      const marginLeft = 10;
      const logoWidth = 30;
      const logoHeight = 20;
      const headerHeight = 20;
      const pageWidth = 210;

      // === Header ===
      doc.rect(marginLeft, currentY, logoWidth, logoHeight);
      doc.addImage(base64Logo, 'JPEG', marginLeft + 1, currentY + 1, logoWidth - 2, logoHeight - 2);

      const centerX = marginLeft + logoWidth;
      const centerWidth = 100;
      doc.rect(centerX, currentY, centerWidth, headerHeight);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMULAIRE', centerX + centerWidth / 2, currentY + 7, {align: 'center'});
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(config.title, centerX + centerWidth / 2, currentY + 14, {align: 'center'});

      const rightX = centerX + centerWidth;
      const rowHeight = 5;
      const infoWidth = pageWidth - rightX - marginLeft;
      const infoRows = [
        {label: 'Référence', value: config.reference},
        {label: 'Révision', value: '00'},
        {label: 'Date', value: documentDate},
        {label: 'Page', value: '1/1'},
      ];
      infoRows.forEach((row, index) => {
        const y = currentY + index * rowHeight;
        doc.rect(rightX, y, infoWidth, rowHeight);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${row.label} : ${row.value}`, rightX + 2, y + 4);
      });

      currentY += headerHeight + 10;

      // Numéro
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('N° : ......./........', pageWidth / 2, currentY, {align: 'center'});
      currentY += 15;

      // === Infos générales ===
      if (config.generalInfo && config.generalInfo.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        config.generalInfo.forEach(info => {
          doc.text(`${info.label} : ${info.value}`, marginLeft, currentY);
          currentY += 10;
        });
        currentY += 15;
      }

      // === Tableau : TH + TD avec hauteur uniforme ===
      if (config.fields && config.fields.length > 0) {
        const tableLeft = marginLeft;
        const tableWidth = 190;
        const colCount = config.fields.length;
        const colWidth = tableWidth / colCount;
        const baseFontSize = 9;

        const splitLabels: string[][] = config.fields.map(field =>
          doc.splitTextToSize(field.label, colWidth - 4)
        );
        const maxLabelLines = Math.max(...splitLabels.map(lines => lines.length));
        const labelRowHeight = maxLabelLines * 5 + 4;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(baseFontSize);
        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.setFillColor(200, 200, 200);
          doc.rect(x, currentY, colWidth, labelRowHeight, 'FD');

          splitLabels[i].forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }

        currentY += labelRowHeight;

        // === Données ===
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);

        const dataRowHeightPerLine = 5;
        const maxDataLines = 6;

        const splitValues: string[][] = config.fields.map(field =>
          doc.splitTextToSize(field.value || '', colWidth - 4)
        );
        const dataHeights = splitValues.map(lines =>
          Math.min(lines.length, maxDataLines) * dataRowHeightPerLine + 4
        );
        const maxDataHeight = Math.max(...dataHeights);

        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          const linesToShow = splitValues[i].slice(0, maxDataLines);

          doc.rect(x, currentY, colWidth, maxDataHeight);
          linesToShow.forEach((line, lineIndex) => {
            doc.text(line, x + 2, currentY + 4 + lineIndex * dataRowHeightPerLine);
          });
        }

        currentY += maxDataHeight + 5;
      }

      // === Footer ===
      if (config.footerInfo && config.footerInfo.length > 0) {
        const separatorY = 270;
        doc.setDrawColor(0);
        doc.line(10, separatorY, 200, separatorY);

        const footerY = 280;
        const marginRight = 10;
        const usableWidth = pageWidth - marginLeft - marginRight;
        const maxItemsPerRow = 4;
        const itemCount = Math.min(config.footerInfo.length, maxItemsPerRow);
        const spacing = usableWidth / itemCount;
        const footerLabelWidth = 40;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        config.footerInfo.slice(0, maxItemsPerRow).forEach((footerItem, index) => {
          const x = marginLeft + index * spacing;
          doc.text(`${footerItem.label} :`, x, footerY);
          if (footerItem.placeholder) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(footerItem.placeholder, x + footerLabelWidth, footerY);
            doc.setTextColor(0);
            doc.setFontSize(10);
          }
        });
      }

      // === Affichage ===
      window.open(doc.output('bloburl'), '_blank');
    });
  }


  getBase64ImageFromUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/jpeg');
        resolve(dataURL);
      };

      img.onerror = error => {
        reject(error);
      };
    });
  }


}
