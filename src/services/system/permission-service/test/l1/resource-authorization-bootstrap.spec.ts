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
  let originalAuthSpiffeId: string | undefined
  let originalWorkloadPolicies: string | undefined

  // Supplies the exact Auth workload identity required by fail-closed module bootstrap.
  beforeEach(() => {
    originalAuthSpiffeId = process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID
    originalWorkloadPolicies = process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES
    process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID = 'spiffe://oes.test/ns/system/sa/auth-service'
    delete process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES
  })

  // Closes the test application and restores the caller's environment.
  afterEach(async () => {
    await app?.close()
    app = undefined
    if (originalAuthSpiffeId === undefined) {
      delete process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID
    } else {
      process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID = originalAuthSpiffeId
    }
    if (originalWorkloadPolicies === undefined) {
      delete process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES
    } else {
      process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES = originalWorkloadPolicies
    }
  })

  it('rejects module bootstrap when workload issuance policy configuration is missing', async () => {
    await expect(compileAuthorizationModule()).rejects.toThrow(
      'PERMISSION_WORKLOAD_ISSUANCE_POLICIES'
    )
  })

  it('rejects module bootstrap when workload issuance policy configuration is invalid', async () => {
    process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES = '{'

    await expect(compileAuthorizationModule()).rejects.toThrow(
      'PERMISSION_WORKLOAD_ISSUANCE_POLICIES'
    )
  })

  it('AuthorizationModule / 应能解析内部 resource authorization provider 与 policy instance repository', async () => {
    process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES = validWorkloadPolicies()
    const moduleRef = await compileAuthorizationModule()

    app = moduleRef.createNestApplication()
    await app.init()

    expect(app.get(ResourceAuthorizationService)).toBeInstanceOf(ResourceAuthorizationService)
    expect(app.get(SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE)).toBeDefined()
  })
})

/** Compiles the Permission authorization boundary with only infrastructure dependencies overridden. */
function compileAuthorizationModule() {
  return Test.createTestingModule({
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
}

/** Supplies one explicit exact deployment policy only to the successful module bootstrap test. */
function validWorkloadPolicies(): string {
  return JSON.stringify([
    {
      originalWorkloadSpiffeId: 'spiffe://local.test/site-service',
      targetAudience: 'urn:oes:service:asset-service',
      permissionCodes: ['asset.internal.resolve'],
      scopeLevel: 'TENANT',
      tenantIds: ['tenant-1'],
      policyVersion: 'policy-v1'
    }
  ])
}
