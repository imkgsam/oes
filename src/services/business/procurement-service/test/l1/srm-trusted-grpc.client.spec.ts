import { Metadata } from '@grpc/grpc-js'
import { SRM_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ProcurementSrmExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/procurement-srm-execution-token-exchange.client'
import { ProcurementSrmInternalTrustedGrpcClient } from '../../src/infrastructure/adapters/srm-internal-trusted-grpc.client'
import { ProcurementSrmTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer'
import { SupplierQueryGrpcAdapter } from '../../src/infrastructure/adapters/supplier-query.grpc.adapter'
import { ProcurementInfrastructureModule } from '../../src/modules/procurement-infrastructure.module'
import { ProcurementTrustedExecutionModule } from '../../src/modules/procurement-trusted-execution.module'

const audience = 'urn:oes:service:srm-service'
const codes = [
  SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER,
  SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING
]

/** Verifies Procurement activates only SRM's two exact HUMAN_OBO eligibility calls. */
describe('Procurement SRM trusted caller', () => {
  it('activates the dedicated SRM graph in trusted and infrastructure DI', () => {
    const providers = Reflect.getMetadata('providers', ProcurementTrustedExecutionModule) as Array<
      unknown | { provide?: unknown }
    >
    const providerTokens = providers.map((provider) =>
      typeof provider === 'object' && provider !== null && 'provide' in provider
        ? provider.provide
        : provider
    )
    expect(providerTokens).toEqual(
      expect.arrayContaining([
        ProcurementSrmInternalTrustedGrpcClient,
        ProcurementSrmExecutionTokenExchangeClient,
        ProcurementSrmTrustedGrpcExecutionProducer
      ])
    )
    expect(Reflect.getMetadata('providers', ProcurementInfrastructureModule)).toEqual(
      expect.arrayContaining([SupplierQueryGrpcAdapter])
    )
  })

  it('calls only the two narrow INTERNAL methods with no body tenant', async () => {
    const service = {
      resolveActiveSupplier: jest.fn(() =>
        of({ supplierId: 'supplier-1', displayName: 'Supplier', status: 1 })
      ),
      resolveActiveSupplierOffering: jest.fn(() =>
        of({
          supplierOfferingId: 'offering-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          status: 1
        })
      )
    }
    const producer = { createMetadata: jest.fn(async () => new Metadata()) }
    const adapter = new SupplierQueryGrpcAdapter(
      { internalQuery: () => service } as never,
      producer as never,
      { getContext: () => ({ requestId: 'request-1', traceId: 'trace-1' }) } as never
    )
    adapter.onModuleInit()

    await expect(adapter.getSupplierById('tenant-1', 'supplier-1')).resolves.toMatchObject({
      supplierId: 'supplier-1'
    })
    await expect(
      adapter.getActiveSupplierOffering('tenant-1', 'supplier-1', 'item-1')
    ).resolves.toMatchObject({ supplierOfferingId: 'offering-1' })
    expect(service.resolveActiveSupplier).toHaveBeenCalledWith(
      { supplierId: 'supplier-1' },
      expect.any(Metadata)
    )
    expect(service.resolveActiveSupplierOffering).toHaveBeenCalledWith(
      { supplierId: 'supplier-1', itemId: 'item-1' },
      expect.any(Metadata)
    )
    expect(producer.createMetadata.mock.calls.map((call) => call[0])).toEqual(codes)
  })

  it('maps only exact SRM audience and INTERNAL Codes through STS', async () => {
    const exchange = new ProcurementSrmExecutionTokenExchangeClient()
    const sts = jest.fn(() =>
      of({
        tokenType: 'Bearer',
        accessToken: 'target',
        grantedAudience: audience,
        grantedPermissionCodes: codes
      })
    )
    ;(exchange as any).getService = () => ({ exchangeExecutionToken: sts })
    await expect(
      exchange.exchange(
        { targetAudience: audience, requestedPermissionCodes: codes },
        new Metadata()
      )
    ).resolves.toMatchObject({
      accessToken: 'target',
      grantedAudience: audience,
      grantedPermissionCodes: codes
    })
    expect(sts).toHaveBeenCalledWith(
      { targetAudience: audience, requestedPermissionCodes: codes },
      expect.any(Metadata)
    )
  })
})
