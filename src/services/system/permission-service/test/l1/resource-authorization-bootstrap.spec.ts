import { INestApplication } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'
import { AuthorizationModule as CommonAuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { ResourceAuthorizationService } from '../../src/application/authorization/resource-authorization.service'
import { SYMBOLS } from '../../src/common/constants/symbols'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { AuthorizationModule } from '../../src/modules/authorization/authorization.module'

describe('Resource authorization bootstrap containment', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('AuthorizationModule / 应能解析内部 resource authorization provider 与 policy instance repository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule.forRoot({ serviceName: 'permission-service' }),
        EventEmitterModule.forRoot(),
        CommonAuthorizationModule,
        AuthorizationModule
      ]
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn()
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()

    expect(app.get(ResourceAuthorizationService)).toBeInstanceOf(ResourceAuthorizationService)
    expect(app.get(SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE)).toBeDefined()
  })
})
