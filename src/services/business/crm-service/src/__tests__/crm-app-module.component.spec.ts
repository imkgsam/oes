import { Test } from '@nestjs/testing'
import { AppModule } from '../app.module'

describe('crm-service app module wiring Component', () => {
  const originalRegistryPort = process.env.SERVICE_REGISTRY_PORT

  beforeAll(() => {
    process.env.SERVICE_REGISTRY_PORT = '50060'
  })

  afterAll(() => {
    if (originalRegistryPort === undefined) delete process.env.SERVICE_REGISTRY_PORT
    else process.env.SERVICE_REGISTRY_PORT = originalRegistryPort
  })

  it('AppModule / should compile the runtime dependency graph for downstream party lookup', async () => {
    await expect(
      Test.createTestingModule({
        imports: [AppModule]
      }).compile()
    ).resolves.toBeDefined()
  })
})
