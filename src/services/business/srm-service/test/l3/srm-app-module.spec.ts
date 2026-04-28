import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'

describe('srm-service app module wiring L3', () => {
  it('AppModule / should compile the runtime dependency graph for downstream party lookup', async () => {
    await expect(
      Test.createTestingModule({
        imports: [AppModule]
      }).compile()
    ).resolves.toBeDefined()
  })
})
