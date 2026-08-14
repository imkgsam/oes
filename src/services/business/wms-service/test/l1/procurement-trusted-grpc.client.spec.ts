import { Metadata } from '@grpc/grpc-js'
import { PROCUREMENT_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { WmsProcurementInternalTrustedGrpcClient } from '../../src/infrastructure/adapters/procurement-internal-trusted-grpc.client'
import { WmsProcurementExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/wms-procurement-execution-token-exchange.client'
import { WmsProcurementTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer'
import { WmsInfrastructureModule } from '../../src/modules/wms-infrastructure.module'

const audience = 'urn:oes:service:procurement-service'
const code = PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT

/** Verifies WMS's dedicated Procurement caller is complete but production-inactive. */
describe('WMS Procurement prepared trusted caller L1', () => {
  it('keeps dedicated client/exchange/producer absent from production DI', () => {
    const providers = Reflect.getMetadata('providers', WmsInfrastructureModule) as unknown[]
    expect(providers).not.toEqual(
      expect.arrayContaining([
        WmsProcurementInternalTrustedGrpcClient,
        WmsProcurementExecutionTokenExchangeClient,
        WmsProcurementTrustedGrpcExecutionProducer
      ])
    )
  })

  it('maps only the Procurement audience and receipt-resolution Code through STS', async () => {
    const exchange = new WmsProcurementExecutionTokenExchangeClient()
    const sts = jest.fn(() =>
      of({
        tokenType: 'Bearer',
        accessToken: 'target',
        grantedAudience: audience,
        grantedPermissionCodes: [code]
      })
    )
    ;(exchange as any).getService = () => ({ exchangeExecutionToken: sts })
    await expect(
      exchange.exchange(
        { targetAudience: audience, requestedPermissionCodes: [code] },
        new Metadata()
      )
    ).resolves.toMatchObject({
      accessToken: 'target',
      grantedAudience: audience,
      grantedPermissionCodes: [code]
    })
    expect(sts).toHaveBeenCalledWith(
      { targetAudience: audience, requestedPermissionCodes: [code] },
      expect.any(Metadata)
    )
  })
})
