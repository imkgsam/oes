import { INTERCEPTORS_METADATA } from '@nestjs/common/constants'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { ExecutionTokenGrpcController } from '../../../../src/interfaces/grpc/execution-token.grpc.controller'

describe('ExecutionTokenGrpcController request scope', () => {
  it('keeps guard-verified HUMAN OBO correlation active through the STS handler', () => {
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, ExecutionTokenGrpcController)).toContain(
      GrpcRequestContextInterceptor
    )
  })
})
