import { ContainerSaleLine, OilSaleCreateRequest } from './oil-sale-create.request';
import { OilSale } from '../../models/oil-sale.model';

/** Return a LocalDateTime (no timezone suffix) so BE (LocalDateTime) won't shift it. */
export function toLocalDateTimeString(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + 'T' + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':');
}

function mapContainerSales(lines: OilSale['containerSales']): ContainerSaleLine[] | undefined {
  if (!lines?.length) {
    return undefined;
  }

  const mapped = lines
    .map((line): ContainerSaleLine | null => {
      const id = line.containerId ?? line.id;
      if (!id || !line.count) {
        return null;
      }
      return { id, count: line.count };
    })
    .filter((line): line is ContainerSaleLine => line !== null);

  return mapped.length ? mapped : undefined;
}

/** Maps the rich UI model to the lean create payload expected by the backend. */
export function mapOilSaleToCreateRequest(ui: OilSale): OilSaleCreateRequest {
  return {
    supplier: ui.supplier?.id,              // send only the id (or undefined)
    storageUnit: ui.storageUnit?.id!,       // required

    quantity: ui.quantity,
    unitPrice: ui.unitPrice,

    currency: ui.currency,
    paymentMethod: ui.paymentMethod,

    saleDate: toLocalDateTimeString(ui.saleDate),
    qualityGrade: ui.qualityGrade,

    description: ui.description,
    deliveryAddress: ui.deliveryAddress,

    paidAmount: ui.paidAmount ?? 0,

    // if containers not provided or empty, omit the field
    containerSales: mapContainerSales(ui.containerSales),
  };
}
