import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { TransactionState } from '../../../shared/models/OilTransaction';
import { deliveryType } from '../../../shared/models/deleveryType';
import { OperationType } from '../../../shared/models/operation-type.enum';
import { PaymentSourceType } from '../supplier-details/supplier-details.component';
import { SupplierPaymentHistoryComponent } from './supplier-payment-history.component';

describe('SupplierPaymentHistoryComponent selected-row payment amount', () => {
  const selectedUnpaidAmount = 120;

  function createComponent(
    rowOverrides: Record<string, unknown>,
    options: {
      oilTransaction?: Record<string, unknown>;
      relatedDelivery?: Record<string, unknown>;
    } = {}
  ): SupplierPaymentHistoryComponent {
    const row = {
      id: 'delivery-1',
      lotNumber: 'LOT-1',
      deliveryType: deliveryType.OLIVE,
      unpaidAmount: selectedUnpaidAmount,
      price: 500,
      ...rowOverrides
    };
    const data = { row, sourceType: PaymentSourceType.DELIVERY_prc };
    const deliveryService = {
      getDeliveryByOliveLotNumber: jasmine
        .createSpy('getDeliveryByOliveLotNumber')
        .and.returnValue(of({ data: options.relatedDelivery ?? { price: 999 } })),
      getDeliveryByLotNumberAndType: jasmine
        .createSpy('getDeliveryByLotNumberAndType')
        .and.returnValue(of({ data: options.relatedDelivery ?? { price: 999 } })),
      processPayment: jasmine.createSpy('processPayment').and.returnValue(of({ data: true }))
    };
    const searchService = {
      search: jasmine.createSpy('search').and.callFake((_search: unknown, endpoint: string) =>
        endpoint === 'finance/banks'
          ? of({ data: [] })
          : of({ data: options.oilTransaction ? [options.oilTransaction] : [] })
      )
    };

    return TestBed.runInInjectionContext(
      () =>
        new SupplierPaymentHistoryComponent(
          deliveryService as any,
          new FormBuilder(),
          searchService as any,
          {} as any,
          {} as any,
          { instant: (key: string) => key } as any,
          data,
          {} as any,
          data,
          { close: jasmine.createSpy('close') } as any
        )
    );
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('uses oil plus cash when exchange oil covers only part of the selected row balance', () => {
    const component = createComponent(
      { operationType: OperationType.EXCHANGE },
      {
        oilTransaction: {
          transactionState: TransactionState.COMPLETED,
          totalPrice: 80,
          quantityKg: 10,
          unitPrice: 8
        }
      }
    );

    component.ngOnInit();

    expect(component.unpaidAmount).toBe(selectedUnpaidAmount);
    expect(component.paymentForm.get('paymentMethod')?.value).toBe('both');
    expect(component.paymentForm.get('oilQuantity')?.value).toBe(10);
    expect(component.paymentForm.get('oilPrice')?.value).toBe(8);
    expect(component.paymentForm.get('amount')?.value).toBe(40);
  });

  it('uses oil only when exchange oil covers the selected row balance', () => {
    const component = createComponent(
      { operationType: OperationType.EXCHANGE },
      {
        oilTransaction: {
          transactionState: TransactionState.COMPLETED,
          totalPrice: selectedUnpaidAmount,
          quantityKg: 10,
          unitPrice: 12
        }
      }
    );

    component.ngOnInit();

    expect(component.paymentForm.get('paymentMethod')?.value).toBe('oil');
    expect(component.paymentForm.get('amount')?.value).toBe(0);
  });

  it('does not replace a BASE row balance with the related oil reception price', () => {
    const component = createComponent(
      { operationType: OperationType.BASE },
      { relatedDelivery: { price: 999 } }
    );

    component.ngOnInit();

    expect(component.unpaidAmount).toBe(selectedUnpaidAmount);
    expect(component.paymentForm.get('amount')?.value).toBe(selectedUnpaidAmount);
  });

  it('calculates a mixed simple-reception payment from the selected row balance', () => {
    const component = createComponent(
      { operationType: OperationType.SIMPLE_RECEPTION },
      { relatedDelivery: { price: 80, oilQuantity: 10, unitPrice: 8 } }
    );

    component.ngOnInit();

    expect(component.hasOilReceptionData).toBeTrue();
    expect(component.unpaidAmount).toBe(selectedUnpaidAmount);
    expect(component.paymentForm.get('paymentMethod')?.value).toBe('both');
    expect(component.paymentForm.get('amount')?.value).toBe(40);
  });

  it('submits the selected balance as an oil payment', () => {
    const component = createComponent({ operationType: OperationType.OLIVE_PURCHASE });
    component.ngOnInit();
    component.paymentForm.patchValue({
      paymentMethod: 'oil',
      amount: 0,
      oilQuantity: 10,
      oilPrice: 12
    });

    (component as any).processDeliveryPaiment();

    expect((component as any).deliveryService.processPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ amount: 120, paymentMethod: 'OIL' })
    );
  });

  it('submits the combined oil and money value as a mixed payment', () => {
    const component = createComponent({ operationType: OperationType.OLIVE_PURCHASE });
    component.ngOnInit();
    component.paymentForm.patchValue({
      paymentMethod: 'both',
      moneyPaymentMethod: 'cash',
      amount: 40,
      oilQuantity: 10,
      oilPrice: 8
    });

    (component as any).processDeliveryPaiment();

    expect((component as any).deliveryService.processPayment).toHaveBeenCalledWith(
      jasmine.objectContaining({ amount: 120, paymentMethod: 'MIXED' })
    );
  });
});
