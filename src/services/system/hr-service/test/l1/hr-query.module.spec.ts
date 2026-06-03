import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { HrQueryService } from '../../src/application/services'

describe('HR query module wiring', () => {
  it('lets the hr-service app resolve read-side employee queries with tenant-org references', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    expect(moduleRef.get(HrQueryService)).toBeInstanceOf(HrQueryService)

    await moduleRef.close()
  })
})
