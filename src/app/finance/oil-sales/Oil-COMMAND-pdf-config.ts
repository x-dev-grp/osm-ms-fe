import { PdfConfig } from '../../shared/models/pdf-config.model';
import { OilSale } from '../models/oil-sale.model';

export function getBonCommandeHuileConfig(data: OilSale): PdfConfig {

  const fmtDate = (d?: string | number | Date | null) => (d ? new Date(d).toLocaleDateString() : '—');

  const text = (v: any, fb = '—') => {
    if (v == null) return fb;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
    const cand = v?.label ?? v?.name ?? v?.code ?? v?.designation ?? v?.id;
    return cand ? String(cand) : fb;
  };

  const qtyKg = (q?: number | null) => (typeof q === 'number' ? `${q.toFixed(2)} kg` : '—');
  const money = (n?: number | null) => (typeof n === 'number' ? `${n.toFixed(2)} TND` : '—');
  const moneyKg = (n?: number | null) => (typeof n === 'number' ? `${n.toFixed(2)} TND/kg` : '—');

  // ------- derived -------
  const clientName = text(data?.supplier?.name + ' ' + data?.supplier?.lastname, '');

  const quantityKg: number | undefined = data?.quantity;
  const unitPrice: number | undefined = data?.unitPrice;
  const totalPrice: number | undefined = Number((quantityKg * unitPrice).toFixed(2));

  const quality = text(data?.qualityGrade, '—');

  // Single “row” fields exactly like your current PDF uses
  const tankNo = text(1);
  const designation = text(data?.description, '—');

  const fileName = `Bon_Commande_Huile_${data?.id ?? 'inconnu'}.pdf`;

  return {
    // Title key you asked for earlier
    title: 'PDF.GEN_PDF_BON_COMMANDE', // fr: Bon de commande huile
    reference: 'FOR-COM-01',
    revision: '00',
    date:'01/12/2024',
     // Header block (order as requested)
    generalInfo: [
      { label: 'PDF.CLIENT', value: clientName },
      { label: 'PDF.OIL_QUANTITY', value: qtyKg(quantityKg) },
      { label: 'PDF.QUALITY', value: 'OIL_TRANSACTIONS.QUALITY_GRADES.' + quality },
      { label: 'PDF.UNIT_PRICE', value: moneyKg(unitPrice) },
      { label: 'PDF.TOTAL_PRICE', value: money(totalPrice) },
      { label: 'PDF.DATE', value: fmtDate(data?.createdDate) }
    ],

    fields: [
      { label: 'PDF.TANK_NUMBER', value: '1' },
      { label: 'PDF.DESIGNATION', value: String(designation) },
      { label: 'PDF.QUANTITY', value: qtyKg(quantityKg) },
      { label: 'PDF.UNIT_PRICE', value: moneyKg(unitPrice) },
      { label: 'PDF.TOTAL_PRICE', value: money(totalPrice) }
    ],

    footerInfo: [{ label: 'PDF.SIGNATURE_AGENT' }, { label: 'PDF.SIGNATURE_RESPONSIBLE' }],

    fileName
  };
}
