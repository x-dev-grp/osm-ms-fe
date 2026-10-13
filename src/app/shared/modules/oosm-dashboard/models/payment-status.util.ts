export type DashboardPaymentStatus = 'paid' | 'partial' | 'unpaid';

export function dashboardPaymentStatus(record: Record<string, unknown>): DashboardPaymentStatus {
  const paidAmount = Number(record?.['paidAmount'] ?? 0);
  const unpaidAmount = Number(record?.['unpaidAmount'] ?? 0);

  if (paidAmount > 0 && unpaidAmount > 0) return 'partial';
  if (unpaidAmount <= 0 && (paidAmount > 0 || record?.['paid'] === true)) return 'paid';
  return 'unpaid';
}
