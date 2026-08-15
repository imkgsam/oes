import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test, TestingModule } from '@nestjs/testing'
import {
  AuthorizationModule as CommonAuthorizationModule,
  ExecutionTokenVerifier
} from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { createGrpcServerCredentials, GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { AuthorizationModule } from '../../src/modules/authorization/authorization.module'
import {
  PERMISSION_AUDIENCE,
  PermissionFoundationTrustedExecutionGuard
} from '../../src/modules/authorization/permission-trusted-execution.module'
import { PermissionModule } from '../../src/modules/permission/permission.module'
import { PolicyModule } from '../../src/modules/policy/policy.module'

/** Locks the permission-service token-only boundary to its exact audience and declaration source. */
describe('permission-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(PERMISSION_AUDIENCE).toBe('urn:oes:service:permission-service')
    const source = readFileSync(
      join(__dirname, '../../src/interfaces/grpc/permission-management.grpc.controller.ts'),
      'utf8'
    )
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })

  it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
    expect(() => createGrpcServerCredentials({})).toThrow('gRPC mTLS is required')
    const source = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8')
    expect(source).toMatch(/credentials:\s*createGrpcServerCredentials\(\)/)
    expect(source).not.toMatch(/OES_GRPC_TLS_ENABLED/)
  })

  it.each([
    ['AuthorizationModule', AuthorizationModule],
    ['PermissionModule', PermissionModule],
    ['PolicyModule', PolicyModule]
  ] as const)(
    '%s resolves its controller guard and trusted verifier dependencies',
    async (_, ownerModule) => {
      const originalAuthSpiffeId = process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID
      const originalWorkloadPolicies = process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES
      process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID = 'spiffe://oes.test/ns/system/sa/auth-service'
      process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES = validWorkloadPolicies()

      let moduleRef: TestingModule | undefined
      try {
        moduleRef = await compileControllerOwner(ownerModule)
        const ownerContext = moduleRef.select(ownerModule)
        const guard = ownerContext.get(PermissionFoundationTrustedExecutionGuard, { strict: true })
        const verifier = (guard as unknown as { verifier: ExecutionTokenVerifier }).verifier
        const workloadIdentity = (
          guard as unknown as { workloadIdentityProvider: GrpcWorkloadIdentityProvider }
        ).workloadIdentityProvider
        expect(guard).toBeInstanceOf(PermissionFoundationTrustedExecutionGuard)
        expect(typeof verifier.verify).toBe('function')
        expect(typeof workloadIdentity.getVerifiedWorkloadIdentity).toBe('function')
      } finally {
        await moduleRef?.close()
        restoreEnvironment('PERMISSION_AUTH_SERVICE_SPIFFE_ID', originalAuthSpiffeId)
        restoreEnvironment('PERMISSION_WORKLOAD_ISSUANCE_POLICIES', originalWorkloadPolicies)
      }
    }
  )
})

/** Compiles one real controller-owner module so Nest must construct every controller guard. */
function compileControllerOwner(ownerModule: typeof AuthorizationModule): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      LoggingModule.forRoot({ serviceName: 'permission-service' }),
      EventEmitterModule.forRoot(),
      CommonAuthorizationModule,
      ownerModule
    ]
  })
    .overrideProvider(PrismaService)
    .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
    .compile()
}

/** Restores one environment value without turning absence into the string "undefined". */
function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

/** Supplies one valid exact workload policy to satisfy AuthorizationModule bootstrap. */
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
