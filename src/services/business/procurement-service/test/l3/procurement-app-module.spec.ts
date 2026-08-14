import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'

/** Verifies the Procurement app composes the frozen trusted inbound dependency graph. */
describe('procurement-service app module wiring L3', () => {
  it('compiles the trusted inbound and existing application modules', async () => {
    await expect(
      Test.createTestingModule({
        imports: [AppModule]
      }).compile()
    ).resolves.toBeDefined()
  })
})
