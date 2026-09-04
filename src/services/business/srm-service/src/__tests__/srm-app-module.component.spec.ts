import { Test } from '@nestjs/testing'
import { AppModule } from '../app.module'

describe('srm-service app module wiring Component', () => {
  it('AppModule / should compile trusted inbound plus Item Master OBO and Party MACHINE graphs', async () => {
    await expect(
      Test.createTestingModule({
        imports: [AppModule]
      }).compile()
    ).resolves.toBeDefined()
  })
})
