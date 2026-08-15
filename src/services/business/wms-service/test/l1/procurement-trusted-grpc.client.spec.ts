import { Metadata } from '@grpc/grpc-js'
import { PROCUREMENT_INTERNAL_PERMISSION_CODES } from '@oes/common/authorization'
import { of } from 'rxjs'
import { WmsProcurementInternalTrustedGrpcClient } from '../../src/infrastructure/adapters/procurement-internal-trusted-grpc.client'
import { WmsProcurementExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/wms-procurement-execution-token-exchange.client'
import { WmsProcurementTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer'
import { WmsInfrastructureModule } from '../../src/modules/wms-infrastructure.module'
import { WmsTrustedExecutionModule } from '../../src/modules/wms-trusted-execution.module'

const audience = 'urn:oes:service:procurement-service'
const code = PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT

/** Verifies WMS's dedicated Procurement caller is active only after trusted ingress. */
describe('WMS Procurement trusted caller L1', () => {
  it('activates dedicated client/exchange/producer through trusted WMS DI', () => {
    const providers = Reflect.getMetadata('providers', WmsTrustedExecutionModule) as unknown[]
    expect(providers.map(providerToken)).toEqual(
      expect.arrayContaining([
        WmsProcurementInternalTrustedGrpcClient,
        WmsProcurementExecutionTokenExchangeClient,
        WmsProcurementTrustedGrpcExecutionProducer
      ])
    )
    expect(Reflect.getMetadata('providers', WmsInfrastructureModule)).toEqual(
      expect.arrayContaining([expect.any(Function)])
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

/** Reads the injection token from either a class or a factory provider. */
function providerToken(provider: unknown): unknown {
  return typeof provider === 'object' && provider !== null && 'provide' in provider
    ? (provider as { provide: unknown }).provide
    : provider
}
