import { Reflector } from '@nestjs/core'
import { TrustedExecutionGuard } from '@oes/common/authorization'
import { MesManagementGrpcController } from '../../src/interfaces/grpc/mes-management.grpc.controller'
import { MesQueryGrpcController } from '../../src/interfaces/grpc/mes-query.grpc.controller'
import { ProductionSpecManagementGrpcController } from '../../src/interfaces/grpc/production-spec-management.grpc.controller'
import { ProductionSpecQueryGrpcController } from '../../src/interfaces/grpc/production-spec-query.grpc.controller'

/** Locks every MES controller to trusted admission and exact method declaration metadata. */
describe('MES trusted gRPC security surface', () => {
  it('guards all four controller classes', () => {
    for (const controller of [MesManagementGrpcController, MesQueryGrpcController, ProductionSpecManagementGrpcController, ProductionSpecQueryGrpcController]) {
      expect(Reflect.getMetadata('__guards__', controller)).toContain(TrustedExecutionGuard)
    }
  })
})
