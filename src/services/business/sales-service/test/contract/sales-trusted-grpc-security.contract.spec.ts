import { Reflector } from '@nestjs/core'
import { TrustedExecutionGuard } from '@oes/common/authorization'
import { PricingManagementGrpcController } from '../../src/interfaces/grpc/pricing-management.grpc.controller'
import { PricingQueryGrpcController } from '../../src/interfaces/grpc/pricing-query.grpc.controller'
import { SalesManagementGrpcController } from '../../src/interfaces/grpc/sales-management.grpc.controller'
import { SalesQueryGrpcController } from '../../src/interfaces/grpc/sales-query.grpc.controller'

/** Locks all four Sales controller surfaces to trusted admission and exact method declarations. */
describe('Sales trusted gRPC security surface', () => {
  it('guards all four controller classes', () => {
    for (const controller of [SalesQueryGrpcController, SalesManagementGrpcController, PricingQueryGrpcController, PricingManagementGrpcController]) {
      expect(Reflect.getMetadata('__guards__', controller)).toContain(TrustedExecutionGuard)
    }
  })
})
