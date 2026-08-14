import { Metadata } from '@grpc/grpc-js'
import { SRM_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { ProcurementSrmExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/procurement-srm-execution-token-exchange.client'
import { ProcurementSrmInternalTrustedGrpcClient } from '../../src/infrastructure/adapters/srm-internal-trusted-grpc.client'
import { ProcurementSrmTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer'
import {
  PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED,
  SupplierQueryGrpcAdapter
} from '../../src/infrastructure/adapters/supplier-query.grpc.adapter'
import { ProcurementInfrastructureModule } from '../../src/modules/procurement-infrastructure.module'

const audience = 'urn:oes:service:srm-service'
const codes = [
  SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER,
  SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING
]

/** Proves both SRM callers are prepared but absent from Procurement production activation. */
describe('Procurement SRM prepared trusted caller', () => {
  it('keeps the dedicated client, exchange, and producer out of production DI', () => {
    const providers = Reflect.getMetadata('providers', ProcurementInfrastructureModule) as unknown[]
    expect(providers).not.toEqual(
      expect.arrayContaining([
        ProcurementSrmInternalTrustedGrpcClient,
        ProcurementSrmExecutionTokenExchangeClient,
        ProcurementSrmTrustedGrpcExecutionProducer
      ])
    )
  })

  it('keeps the active supplier port fail-closed before trusted Procurement inbound exists', async () => {
    const adapter = new SupplierQueryGrpcAdapter()
    await expect(adapter.getSupplierById('tenant-1', 'supplier-1')).rejects.toThrow(
      PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED
    )
    await expect(
      adapter.getActiveSupplierOffering('tenant-1', 'supplier-1', 'item-1')
    ).rejects.toThrow(PROCUREMENT_SRM_PREPARED_NOT_ACTIVATED)
  })

  it('maps only exact SRM audience and INTERNAL Codes through the prepared STS client', async () => {
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
