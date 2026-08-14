import { ProcurementReceivingExpectationGrpcAdapter } from '../../src/infrastructure/adapters/procurement-receiving-expectation.grpc.adapter'
import { WmsProcurementInternalTrustedGrpcClient } from '../../src/infrastructure/adapters/procurement-internal-trusted-grpc.client'
import { WmsProcurementExecutionTokenExchangeClient } from '../../src/infrastructure/adapters/wms-procurement-execution-token-exchange.client'
import { WmsProcurementTrustedGrpcExecutionProducer } from '../../src/infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer'
import { WmsInfrastructureModule } from '../../src/modules/wms-infrastructure.module'

/** Locks WMS production DI to the fail-closed adapter until its trusted inbound packet lands. */
describe('wms-service Procurement preparation wiring L3', () => {
  it('registers only the fail-closed port adapter and leaves prepared trust classes inactive', () => {
    const providers = Reflect.getMetadata('providers', WmsInfrastructureModule) as unknown[]
    expect(providers).toEqual(expect.arrayContaining([ProcurementReceivingExpectationGrpcAdapter]))
    expect(providers).not.toEqual(
      expect.arrayContaining([
        WmsProcurementInternalTrustedGrpcClient,
        WmsProcurementExecutionTokenExchangeClient,
        WmsProcurementTrustedGrpcExecutionProducer
      ])
    )
  })
})
