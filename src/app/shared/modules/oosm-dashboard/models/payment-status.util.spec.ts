import { dashboardPaymentStatus } from './payment-status.util';

describe('dashboardPaymentStatus', () => {
  it('returns partial when paid and unpaid amounts are both positive', () => {
    expect(dashboardPaymentStatus({ paid: false, paidAmount: 40, unpaidAmount: 60 })).toBe('partial');
  });

  it('returns paid when no unpaid balance remains', () => {
    expect(dashboardPaymentStatus({ paid: true, paidAmount: 100, unpaidAmount: 0 })).toBe('paid');
  });

  it('returns unpaid when no payment was made', () => {
    expect(dashboardPaymentStatus({ paid: false, paidAmount: 0, unpaidAmount: 100 })).toBe('unpaid');
  });
});
