import { attachVerifiedExecution } from '@oes/common/authorization'
import { PricingManagementGrpcController } from '../../src/interfaces/grpc/pricing-management.grpc.controller'
import { PricingQueryGrpcController } from '../../src/interfaces/grpc/pricing-query.grpc.controller'

function createPricingManagementController() {
  return new PricingManagementGrpcController(
    {
      execute: jest.fn()
    } as never,
    {
      recordCommand: jest.fn((_input, callback: () => unknown) => callback())
    } as never
  )
}

function createPricingQueryController() {
  return new PricingQueryGrpcController({
    execute: jest.fn()
  } as never)
}

function trustedRequest(overrides: Record<string, unknown> = {}) {
  const request = { ...overrides }
  const context = attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example.test', audience: 'urn:oes:service:sales-service', subject: 'operator-1', principalType: 'HUMAN', clientId: 'spiffe://oes/gateway', tenantId: 'tenant-1', orgId: 'org-1', permissionCodes: ['sales.pricing.price_list.manage'], tokenId: 'token-1', issuedAt: 1, notBefore: 1, expiresAt: 2, certificateThumbprint: 'A'.repeat(43), sessionId: 'session-1', sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: { spiffeId: 'spiffe://oes/gateway', certificateThumbprint: 'A'.repeat(43) }
  }) as { requestId?: string; traceId?: string }
  context.requestId = 'request-1'; context.traceId = 'trace-1'; return request
}

describe('sales-service pricing grpc surface L3', () => {
  it('PreviewQuoteLinePricing / should map the domain preview result into the frozen gRPC response shape', async () => {
    const controller = createPricingQueryController()
    ;(controller as never).queryBus.execute = jest.fn().mockResolvedValue({
      priceSnapshot: {
        currencyCode: 'USD',
        unitPriceAmount: '90.00',
        sourceType: 'CUSTOMER_PRICE_AGREEMENT',
        sourceRefId: 'agreement-1',
        sourceLineRefId: 'agreement-line-1',
        sourceVersionNo: 2,
        resolvedAt: '2026-04-28T08:00:00.000Z'
      },
      moqSnapshot: {
        moqQuantity: '30',
        quantityUomCode: 'PCS',
        sourceType: 'CUSTOMER_PRICE_AGREEMENT',
        sourceRefId: 'agreement-1',
        sourceLineRefId: 'agreement-line-1',
        sourceVersionNo: 2,
        resolvedAt: '2026-04-28T08:00:00.000Z'
      },
      exchangeRateSnapshot: {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'CNY',
        exchangeRateValue: '7.200000',
        financeRateRef: 'finance-rate-usd-cny',
        effectiveAt: '2026-04-28T00:00:00.000Z',
        snapshottedAt: '2026-04-28T08:00:00.000Z'
      },
      exceptionPlaceholders: [
        {
          exceptionType: 'LOW_PRICE',
          status: 'REQUIRED',
          baselineSourceType: 'CUSTOMER_PRICE_AGREEMENT',
          baselineValue: '95.00',
          actualValue: '90.00',
          currencyCode: 'USD',
          quantityUomCode: '',
          detectedAt: '2026-04-28T08:00:00.000Z'
        }
      ]
    })

    const response = await controller.previewQuoteLinePricing(trustedRequest({
      tenantId: 'tenant-1',
      operatorContext: {
        operatorId: 'operator-1',
        operatorType: 'HUMAN',
        orgId: 'org-1'
      },
      traceContext: {
        traceId: 'trace-1',
        requestId: 'request-1'
      },
      customerTenantPartyId: 'party-1',
      itemId: 'item-1',
      brandKey: 'brand-a',
      currencyCode: 'USD',
      requestedQuantity: '40',
      quantityUomCode: 'PCS',
      exchangeRateTargetCurrencyCode: 'CNY'
    }) as never)

    expect(response.priceSnapshot?.sourceType).toBe(1)
    expect(response.priceSnapshot?.unitPriceAmount).toBe('90.00')
    expect(response.moqSnapshot?.moqQuantity).toBe('30')
    expect(response.exchangeRateSnapshot?.exchangeRateValue).toBe('7.200000')
    expect(response.exceptionPlaceholders).toHaveLength(1)
  })

  it('CreatePriceList / should run through the management audit envelope wrapper and return the created resource', async () => {
    const controller = createPricingManagementController()
    const recordCommand = jest.fn(async (_input, callback: () => Promise<unknown>) => callback())
    ;(controller as never).auditService.recordCommand = recordCommand
    ;(controller as never).commandBus.execute = jest.fn().mockResolvedValue({
      id: 'price-list-1',
      tenantId: 'tenant-1',
      priceListName: 'Spring Fair USD',
      priceListType: 'EXHIBITION',
      status: 'DRAFT',
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01T00:00:00.000Z',
      effectiveTo: '2026-05-31T23:59:59.000Z',
      lines: []
    })

    const response = await controller.createPriceList(trustedRequest({
      tenantId: 'tenant-1',
      operatorContext: {
        operatorId: 'operator-1',
        operatorType: 'HUMAN',
        orgId: 'org-1'
      },
      traceContext: {
        traceId: 'trace-1',
        requestId: 'request-1'
      },
      auditContext: {
        auditId: 'audit-1',
        reason: 'create price list',
        source: 'sales-workspace'
      },
      priceListName: 'Spring Fair USD',
      priceListType: 3,
      currencyCode: 'USD',
      effectiveFrom: '2026-04-01T00:00:00.000Z',
      effectiveTo: '2026-05-31T23:59:59.000Z',
      initialLines: []
    }) as never)

    expect(recordCommand).toHaveBeenCalledTimes(1)
    expect(response.priceList?.priceListId).toBe('price-list-1')
    expect(response.priceList?.status).toBe(1)
  })
})
