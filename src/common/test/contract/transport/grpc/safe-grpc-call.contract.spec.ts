import { status as GrpcStatus } from '@grpc/grpc-js'
import { RpcException } from '@nestjs/microservices'
import { throwError } from 'rxjs'
import { safeGrpcCall } from '../../../../src/transport/grpc/safe-grpc-call'

describe('safeGrpcCall', () => {
  it('preserves standardized business payloads based on semantic error code instead of grpc status alone', async () => {
    const payload = {
      grpcStatus: GrpcStatus.INTERNAL,
      code: 'ROLE_NOT_ASSIGNABLE',
      message: 'Role is not assignable in the current tenant context',
      details: {
        roleId: 'role-1'
      }
    }

    const error = await safeGrpcCall(
      throwError(() =>
        Object.assign(new Error(payload.message), {
          code: GrpcStatus.INTERNAL,
          details: JSON.stringify(payload)
        })
      )
    ).then(
      () => null,
      (reason) => reason
    )

    expect(error).toBeInstanceOf(RpcException)
    expect((error as RpcException).getError()).toMatchObject(payload)
  })
})
