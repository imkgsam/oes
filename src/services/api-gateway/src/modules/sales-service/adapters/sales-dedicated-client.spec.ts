import { GatewaySalesGrpcClient } from '../../../common/grpc'
import { PricingQueryGrpcAdapter } from './pricing-query-grpc.adapter'
import { PricingManagementGrpcAdapter } from './pricing-management-grpc.adapter'
import { SalesManagementGrpcAdapter } from './sales-management-grpc.adapter'
import { SalesQueryGrpcAdapter } from './sales-query-grpc.adapter'

/** Verifies every Sales adapter receives the dedicated token-only client rather than a generic client token. */
describe('Sales dedicated client adapters', () => {
  it('declares GatewaySalesGrpcClient as its concrete channel dependency', () => {
    for (const adapter of [SalesQueryGrpcAdapter, SalesManagementGrpcAdapter, PricingQueryGrpcAdapter, PricingManagementGrpcAdapter]) {
      const parameters = Reflect.getMetadata('design:paramtypes', adapter) as unknown[]
      expect(parameters).toContain(GatewaySalesGrpcClient)
    }
  })
})
