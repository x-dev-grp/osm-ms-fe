import {Injectable} from '@angular/core';
import jsPDF from 'jspdf';
import {UnifiedDelivery} from "../models/UnifiedDelivery";


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
    const logoPath = 'assets/logo.jpg';

    this.getBase64ImageFromUrl(logoPath).then(base64Logo => {
      const doc = new jsPDF();
      let currentY = 10;

      const documentDate = config.date || new Date().toLocaleDateString();

      // Dimensions
      const marginLeft = 10;
      const logoWidth = 30;
      const logoHeight = 20;
      const headerHeight = 20;
      const pageWidth = 210;

      // Logo
      doc.rect(marginLeft, currentY, logoWidth, logoHeight);
      doc.addImage(base64Logo, 'JPEG', marginLeft + 1, currentY + 1, logoWidth - 2, logoHeight - 2);

      // Centre
      const centerX = marginLeft + logoWidth;
      const centerWidth = 100;
      doc.rect(centerX, currentY, centerWidth, headerHeight);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMULAIRE', centerX + centerWidth / 2, currentY + 7, {align: 'center'});
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(config.title, centerX + centerWidth / 2, currentY + 14, {align: 'center'});

      // Droite
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

      // Infos générales
      if (config.generalInfo && config.generalInfo.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        config.generalInfo.forEach(info => {
          doc.text(`${info.label} : ${info.value}`, marginLeft, currentY);
          currentY += 10;
        });
        currentY += 15;
      }

      // === Tableau horizontal (labels en haut, données en bas) ===
      if (config.fields && config.fields.length > 0) {
        const tableLeft = marginLeft;
        const tableWidth = 190;
        const colCount = config.fields.length;
        const colWidth = tableWidth / colCount;
        const baseFontSize = 9;

        // Split & calcul des lignes pour les labels
        const splitLabels: string[][] = config.fields.map(field =>
          doc.splitTextToSize(field.label, colWidth - 4)
        );
        const lineHeights = splitLabels.map(lines => lines.length);
        const maxLines = Math.max(...lineHeights);
        const labelRowHeight = maxLines * 5 + 2;

        // TH (labels)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(baseFontSize);
        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.setFillColor(200, 200, 200);
          doc.rect(x, currentY, colWidth, labelRowHeight, 'FD');

          const lines = splitLabels[i];
          lines.forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }

        // TD (données)
        currentY += labelRowHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);
        // Split & calcul des lignes pour les valeurs (données)
        const splitValues: string[][] = config.fields.map(field =>
          doc.splitTextToSize(field.value || '', colWidth - 4)
        );
        const valueLineHeights = splitValues.map(lines => lines.length);
        const maxValueLines = Math.max(...valueLineHeights);
        const dataRowHeight = maxValueLines * 5 + 2;

// TD (données)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(baseFontSize);

        for (let i = 0; i < colCount; i++) {
          const x = tableLeft + i * colWidth;
          doc.rect(x, currentY, colWidth, dataRowHeight);

          const lines = splitValues[i];
          lines.forEach((line, lineIndex) => {
            const yText = currentY + 6 + lineIndex * 5;
            doc.text(line, x + 2, yText);
          });
        }
        currentY += dataRowHeight + 5;

        currentY += rowHeight + 15;
      }

      // FOOTER
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

      // Affichage du PDF
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


  // pdf-generator.service.ts

  generateReceptionPdf(
    delivery: UnifiedDelivery,
    type: 'OIL' | 'OLIVE'
  ): void {
    const isHuile = type === 'OIL';

    const commonData = {
      reference: delivery.lotNumber || '',
      date: '',
      generalInfo: [
        {label: 'Type', value: delivery.deliveryType || ''},
        {
          label: 'Fournisseur',
          value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
        },
        {label: 'Téléphone', value: delivery.supplier?.supplierInfo?.phone || ''},
        {label: 'Adresse', value: delivery.supplier?.supplierInfo?.address || ''}
      ],
      footerInfo: [
        {label: 'Signature Agent (bascule)', placeholder: ''},
        {label: 'Signature Responsable CQ', placeholder: ''}
      ]
    };

    const fields = isHuile
      ? [
        {label: 'Lot', value: delivery.lotNumber || ''},
        {label: 'Lot Global', value: delivery.globalLotNumber || ''},
        {label: 'Poids Brut', value: `${delivery.poidsBrute || ''} kg`},
        {label: "Quantité d'huile", value: `${delivery.oilQuantity || ''} kg`},
        {label: 'Variété Huile', value: delivery.oilVariety?.name || ''},
        {label: 'Type Huile', value: delivery.oilType?.name || ''},
        {label: 'Région', value: delivery.region?.name || ''}
      ]
      : [
        {label: 'Lot', value: delivery.lotNumber || ''},
        {label: 'Lot Global', value: delivery.globalLotNumber || ''},
        {label: 'Poids Brut', value: `${delivery.poidsBrute || ''} kg`},
        {label: "Quantité Olive", value: `${delivery.oilQuantity || ''} kg`},
        {label: 'Variété Olive', value: delivery.oliveVariety?.name || ''},
        {label: 'Type Olive', value: delivery.oliveType?.name || ''},
        {label: 'Région', value: delivery.region?.name || ''}
      ];

    const title = isHuile ? 'Bon De Réception Huile' : 'Bon De Réception Olive';
    const fileName = isHuile
      ? `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
      : `Bon_Reception_Olive_${delivery.deliveryNumber || 'inconnu'}.pdf`;

    this.generatePdfDocument({
      ...commonData,
      title,
      fields,
      fileName
    });
  }


}
