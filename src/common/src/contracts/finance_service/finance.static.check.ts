import { describe, it, test } from 'node:test'
import { expect } from '../../testing/static-check-assertions.mjs'
import { fileURLToPath } from 'node:url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** Locks Finance's trusted-execution request tombstones without changing Finance-owned response projections. */
describe('finance trusted grpc contract', () => {
  const proto = readFileSync(resolve(__dirname, 'finance.proto'), 'utf8')

  const queryRequests = [
    'GetFinancialAccountRequest',
    'SearchFinancialAccountsRequest',
    'SearchAccountTransactionsRequest',
    'GetExchangeRateRequest',
    'GetReceivableScheduleRequest',
    'SearchReceivableSchedulesRequest',
    'GetFinanceReleaseSignalRequest',
    'GetPayableScheduleRequest',
    'SearchPayableSchedulesRequest',
    'SearchPaymentRequestsRequest',
    'SearchPaymentExecutionsRequest',
    'SearchPaymentAllocationsRequest'
  ]

  const managementRequests = [
    'CreateFinancialAccountRequest',
    'UpdateFinancialAccountBasicsRequest',
    'ImportAccountTransactionsRequest',
    'RecordAccountTransactionRequest',
    'RegisterCustomerFinancialAccountRequest',
    'SetExchangeRateRequest',
    'CreateReceivableScheduleFromSalesOrderRequest',
    'SetFinanceReleaseSignalRequest',
    'CreatePayableScheduleFromPurchaseOrderRequest',
    'ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest',
    'CreatePaymentRequestRequest',
    'DecidePaymentRequestRequest',
    'ExecutePaymentRequestRequest',
    'AllocatePaymentToPayableRequest',
    'AllocatePaymentToReceivableRequest'
  ]

  it('reserves all 96 request authority fields across the frozen 27 RPCs', () => {
    for (const requestName of queryRequests) {
      expect(message(requestName)).toMatch(/reserved 1, 2, 3(?:, 4)?;/)
    }
    for (const requestName of managementRequests) {
      expect(message(requestName)).toMatch(/reserved 1, 2, 3, 4(?:, [59])?;/)
    }
  })

  it('reserves org and caller identity authority while retaining Finance-owned projections', () => {
    for (const requestName of [
      'SearchFinancialAccountsRequest',
      'SearchAccountTransactionsRequest',
      'SearchReceivableSchedulesRequest',
      'SearchPayableSchedulesRequest',
      'SearchPaymentRequestsRequest',
      'SearchPaymentExecutionsRequest'
    ]) {
      expect(message(requestName)).toContain('reserved 1, 2, 3, 4;')
    }
    for (const requestName of [
      'CreateFinancialAccountRequest',
      'CreateReceivableScheduleFromSalesOrderRequest',
      'CreatePayableScheduleFromPurchaseOrderRequest',
      'ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest',
      'CreatePaymentRequestRequest'
    ]) {
      expect(message(requestName)).toContain('reserved 1, 2, 3, 4, 5;')
    }
    expect(message('ImportAccountTransactionsRequest')).toContain('reserved 1, 2, 3, 4, 9;')
    expect(message('SetExchangeRateRequest')).toContain('reserved 1, 2, 3, 4, 9;')
    for (const projection of [
      'FinancialAccount',
      'ExchangeRate',
      'ReceivableSchedule',
      'FinanceReleaseSignal',
      'PayableSchedule',
      'PaymentRequest'
    ]) {
      expect(message(projection)).toMatch(/string tenant_id = \d+;/)
    }
  })

  function message(name: string): string {
    return proto.match(new RegExp(`message ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
  }
})
