import {jsPDF} from 'jspdf';
import {BonModel} from '../models/BonModel';

export function genererBonPDF(model: BonModel): void {
  const doc = new jsPDF();

  // Paramètres de mise en page
  const margin = 10;
  const titleX = 50;
  const titleY = 15;

  // En-tête
  if (model.entete.logo) {
    doc.addImage(model.entete.logo, 'PNG', margin, margin, 30, 30);
  }

  // Titre principal
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(model.entete.titre, titleX, titleY, {align: 'center'});

  // Sous-titre
  if (model.entete.sousTitre) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(model.entete.sousTitre, titleX, titleY + 8, {align: 'center'});
  }

  // Bloc d'informations à droite
  const infoBoxX = 160;
  const infoBoxY = margin;
  const infoBoxWidth = 40;
  const infoBoxHeight = 40;
  doc.setLineWidth(0.5);

  let currentY = infoBoxY + 5;
  if (model.entete.reference) {
    doc.rect(infoBoxX, currentY, infoBoxWidth, 7);
    doc.text(`Référence :`, infoBoxX + 5, currentY + 3);
    currentY += 10;
  }
  if (model.entete.date) {
    doc.rect(infoBoxX, currentY, infoBoxWidth, 7);
    doc.text(`Date :`, infoBoxX + 5, currentY + 3);
    currentY += 10;
  }
  if (model.entete.page) {
    doc.rect(infoBoxX, currentY, infoBoxWidth, 7);
    doc.text(`Page :`, infoBoxX + 5, currentY + 3);
    currentY += 10;
  }
  if (model.entete.revision) {
    doc.rect(infoBoxX, currentY, infoBoxWidth, 7);
    doc.text(`Révision :`, infoBoxX + 5, currentY + 3);
    currentY += 10;
  }

  // Ligne de séparation
  doc.line(margin, infoBoxY + infoBoxHeight + 5, 200, infoBoxY + infoBoxHeight + 5);

  // Informations générales
  const startXLeft = margin; // Début de la première colonne
  const startYInfo = infoBoxY + infoBoxHeight + 15; // Début des informations
  let currentYLeft = startYInfo;

  const generalInfo = model.body.informationsGenerales;
  if (generalInfo) {
    doc.setFontSize(10);
    doc.text(`N° Réception : ${generalInfo.numeroReception ?? ''}`, startXLeft, currentYLeft);
    currentYLeft += 7;
    doc.text(`Date : ${generalInfo.date ?? ''}`, startXLeft, currentYLeft);
    currentYLeft += 7;
    doc.text(`Fournisseur : ${generalInfo.fournisseur ?? ''}`, startXLeft, currentYLeft);
    currentYLeft += 7;
    doc.text(`Tel : ${generalInfo.telephone ?? ''}`, startXLeft, currentYLeft);
    currentYLeft += 7;
    doc.text(`N° Lot : ${generalInfo.numeroLot ?? ''}`, startXLeft, currentYLeft);
    currentYLeft += 7;
    doc.text(`Type : ${generalInfo.type ?? ''}`, startXLeft, currentYLeft);
  }

  // Tableau
  if (model.body.table) {
    const tableStartX = margin;
    const tableStartY = currentYLeft + 15;
    const colWidth = 30;
    const rowHeight = 7;

    // Bordure du tableau
    doc.setDrawColor(0); // Couleur noire
    doc.setLineWidth(0.5);

    // Colonnes
    doc.setFont('helvetica', 'bold');
    model.body.table.colonnes?.forEach((col, i) => {
      doc.rect(tableStartX + i * colWidth, tableStartY, colWidth, rowHeight);
      doc.text(col, tableStartX + i * colWidth + 5, tableStartY + 3);
    });

    // Lignes
    let currentRowY = tableStartY + rowHeight;
    model.body.table.lignes?.forEach(row => {
      row.forEach((cell, i) => {
        doc.rect(tableStartX + i * colWidth, currentRowY, colWidth, rowHeight);
        doc.text(String(cell), tableStartX + i * colWidth + 5, currentRowY + 3);
      });
      currentRowY += rowHeight;
    });
  }

  // Signatures
  if (model.pied?.signatures?.length) {
    const signatureStartX = margin;
    const signatureStartY = 190;
    const signatureSpacing = 50;
    const signatureWidth = 100;

    model.pied.signatures.forEach((sig, index) => {
      const x = signatureStartX + index * signatureSpacing;
      doc.text(sig, x, signatureStartY);
      doc.line(x, signatureStartY + 7, x + signatureWidth, signatureStartY + 7);
    });
  }

  // Afficher le PDF dans un nouvel onglet
  window.open(doc.output('bloburl'), '_blank');
}
