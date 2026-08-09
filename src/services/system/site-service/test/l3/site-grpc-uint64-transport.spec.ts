import { loadSync, MessageTypeDefinition } from '@grpc/proto-loader'
import { NestFactory } from '@nestjs/core'

const MAX_UINT64 = '18446744073709551615'

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createMicroservice: jest.fn().mockResolvedValue({
      get: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      useLogger: jest.fn()
    })
  }
}))
jest.mock('@oes/common/tracing', () => ({ initOtelSdk: jest.fn() }))
jest.mock('@oes/common/transport', () => ({ createGrpcServerCredentials: jest.fn(() => ({})) }))
jest.mock('../../src/app.module', () => ({
  /** MockAppModule isolates bootstrap transport configuration from application dependencies. */
  AppModule: class MockAppModule {}
}))

// Verifies the live site-service bootstrap loader preserves uint64 registration fencing values.
describe('site-service uint64 gRPC transport', () => {
  beforeAll(async () => {
    const { bootstrap } = require('../../src/main') as { bootstrap: () => Promise<void> }
    expect(NestFactory.createMicroservice).not.toHaveBeenCalled()
    await bootstrap()
  })

  it.each(['0', MAX_UINT64])(
    'decodes generation %s as a string and repeated fields as arrays on server ingress',
    (expectedRegistrationGeneration) => {
      const createMicroservice = NestFactory.createMicroservice as jest.Mock
      const microserviceOptions = createMicroservice.mock.calls[0][1]
      const definition = loadSync(
        microserviceOptions.options.protoPath,
        microserviceOptions.options.loader
      )
      const requestCodec = definition[
        'site_service.RegisterPageCapabilitiesRequest'
      ] as MessageTypeDefinition<Record<string, unknown>, Record<string, unknown>>

      const decoded = requestCodec.deserialize(
        requestCodec.serialize({ expectedRegistrationGeneration })
      ) as Record<string, unknown>

      expect(decoded.expectedRegistrationGeneration).toBe(expectedRegistrationGeneration)
      expect(typeof decoded.expectedRegistrationGeneration).toBe('string')
      expect(decoded.capabilities).toEqual([])
    }
  )
})
