import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import {
  AllocatePaymentToPayableCommand,
  CreatePayableScheduleFromPurchaseOrderCommand,
  CreatePaymentRequestCommand
} from '../application/commands/payment-management.commands'
import {
  GetPayableScheduleQuery,
  SearchPaymentExecutionsQuery,
  SearchPaymentRequestsQuery
} from '../application/queries/payment-query.queries'

/** createValidatingCommandBus builds one validating command bus with a mocked downstream execute path. */
function createValidatingCommandBus() {
  const execute = jest.fn(async (command: unknown) => command)
  const bus = new ValidatingCommandBus({ execute } as unknown as CommandBus)
  return { bus, execute }
}

/** createValidatingQueryBus builds one validating query bus with a mocked downstream execute path. */
function createValidatingQueryBus() {
  const execute = jest.fn(async (query: unknown) => query)
  const bus = new ValidatingQueryBus({ execute } as unknown as QueryBus)
  return { bus, execute }
}

describe('finance-service payables cqrs validation wiring Contract', () => {
  it('CreatePayableScheduleFromPurchaseOrderCommand / when payload wrapper is present / should pass validating command bus', async () => {
    const { bus, execute } = createValidatingCommandBus()
    const command = new CreatePayableScheduleFromPurchaseOrderCommand({
      tenantId: 'tenant-1',
      purchaseOrderId: 'po-1',
      supplierTenantPartyId: 'supplier-1',
      supplierSnapshot: 'Supplier One',
      currencyCode: 'USD',
      lines: [
        {
          lineType: 'DEPOSIT',
          sourceRef: 'po-1/deposit',
          dueDate: '2099-01-01',
          scheduledAmount: '10.00'
        }
      ]
    })

    await expect(bus.execute(command)).resolves.toBe(command)
    expect(execute).toHaveBeenCalledWith(command)
  })

  it('CreatePaymentRequestCommand / when payload wrapper is present / should pass validating command bus', async () => {
    const { bus, execute } = createValidatingCommandBus()
    const command = new CreatePaymentRequestCommand({
      tenantId: 'tenant-1',
      requestSource: 'FINANCE_INITIATED',
      supplierTenantPartyId: 'supplier-1',
      beneficiarySupplierFinancialAccountId: 'supplier-account-1',
      currencyCode: 'USD',
      requestedAmount: '10.00',
      requestedLines: [
        {
          payableScheduleId: 'payable-1',
          payableScheduleLineId: 'payable-line-1',
          requestedAmount: '10.00'
        }
      ]
    })

    await expect(bus.execute(command)).resolves.toBe(command)
    expect(execute).toHaveBeenCalledWith(command)
  })

  it('AllocatePaymentToPayableCommand / when payload wrapper is present / should pass validating command bus', async () => {
    const { bus, execute } = createValidatingCommandBus()
    const command = new AllocatePaymentToPayableCommand({
      tenantId: 'tenant-1',
      accountTransactionId: 'tx-1',
      paymentExecutionId: 'exec-1',
      allocations: [
        {
          payableScheduleId: 'payable-1',
          payableScheduleLineId: 'payable-line-1',
          allocatedAmount: '10.00'
        }
      ]
    })

    await expect(bus.execute(command)).resolves.toBe(command)
    expect(execute).toHaveBeenCalledWith(command)
  })

  it('GetPayableScheduleQuery / when scalar fields are present / should pass validating query bus', async () => {
    const { bus, execute } = createValidatingQueryBus()
    const query = new GetPayableScheduleQuery('tenant-1', 'payable-1')

    await expect(bus.execute(query)).resolves.toBe(query)
    expect(execute).toHaveBeenCalledWith(query)
  })

  it('SearchPaymentRequestsQuery / when input wrapper is present / should pass validating query bus', async () => {
    const { bus, execute } = createValidatingQueryBus()
    const query = new SearchPaymentRequestsQuery({
      tenantId: 'tenant-1',
      supplierTenantPartyId: 'supplier-1',
      page: 1,
      pageSize: 20
    })

    await expect(bus.execute(query)).resolves.toBe(query)
    expect(execute).toHaveBeenCalledWith(query)
  })

  it('SearchPaymentExecutionsQuery / when input wrapper is present / should pass validating query bus', async () => {
    const { bus, execute } = createValidatingQueryBus()
    const query = new SearchPaymentExecutionsQuery({
      tenantId: 'tenant-1',
      paymentRequestId: 'request-1',
      page: 1,
      pageSize: 20
    })

    await expect(bus.execute(query)).resolves.toBe(query)
    expect(execute).toHaveBeenCalledWith(query)
  })
})
