import { ItemMasterStockableQueryGrpcAdapter } from '../infrastructure/adapters/item-master-stockable-query.grpc.adapter'
import { ProcurementReceivingExpectationGrpcAdapter } from '../infrastructure/adapters/procurement-receiving-expectation.grpc.adapter'
import { WmsInfrastructureModule } from '../modules/wms-infrastructure.module'
import { WmsTrustedExecutionModule } from '../modules/wms-trusted-execution.module'

/** Locks WMS production DI to verified ingress plus both exact HUMAN_OBO adapters. */
describe('wms-service trusted composition wiring Component', () => {
  it('imports the trusted module and activates both downstream eligibility adapters', () => {
    const imports = Reflect.getMetadata('imports', WmsInfrastructureModule) as unknown[]
    const providers = Reflect.getMetadata('providers', WmsInfrastructureModule) as unknown[]
    expect(imports).toEqual(expect.arrayContaining([WmsTrustedExecutionModule]))
    expect(providers).toEqual(
      expect.arrayContaining([
        ItemMasterStockableQueryGrpcAdapter,
        ProcurementReceivingExpectationGrpcAdapter
      ])
    )
  })
})
