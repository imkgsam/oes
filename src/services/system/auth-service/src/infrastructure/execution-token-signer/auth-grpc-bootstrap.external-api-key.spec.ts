import { createAuthGrpcMicroserviceOptions } from './auth-grpc-bootstrap'

describe('Auth gRPC bootstrap external API-key contract', () => {
  it('loads all frozen Auth proto paths on the existing host', () => {
    const options: any = createAuthGrpcMicroserviceOptions({} as any, ['auth.proto', 'execution_token.proto', 'external_api_key.proto'])
    expect(options.options.protoPath).toEqual(['auth.proto', 'execution_token.proto', 'external_api_key.proto'])
  })
})
