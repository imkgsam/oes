import { ServerCredentials } from '@grpc/grpc-js'
import { Transport } from '@nestjs/microservices'
import { createAuthGrpcMicroserviceOptions } from './auth-grpc-bootstrap'

/** Ensures Auth exposes its STS gRPC surface only with caller-supplied mTLS server credentials. */
describe('createAuthGrpcMicroserviceOptions', () => {
  it('passes the verified TLS credentials into the Auth gRPC listener without an insecure alternative', () => {
    const credentials = {} as ServerCredentials

    expect(
      createAuthGrpcMicroserviceOptions(credentials, [
        '/contracts/auth_service/auth.proto',
        '/contracts/auth_service/execution_token.proto'
      ])
    ).toEqual(
      expect.objectContaining({
        transport: Transport.GRPC,
        options: expect.objectContaining({ credentials })
      })
    )
  })
})
