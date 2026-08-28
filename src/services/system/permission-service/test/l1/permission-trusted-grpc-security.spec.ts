import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Metadata } from '@grpc/grpc-js'
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
    ['WEB', true],
    ['PDA', true],
    ['KIOSK', false]
  ] as const)(
    'admits only the currently implemented HUMAN session terminals: %s',
    async (terminal, allowed) => {
      const metadata = new Metadata()
      metadata.set('authorization', 'Bearer e30.e30.e30')
      metadata.set('x-request-id', 'request-1')
      metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
      const data = {}
      const declaration = Object.freeze({
        mode: 'INTERNAL' as const,
        permissions: Object.freeze({
          all: Object.freeze(['permission.internal.account_navigation.resolve'])
        })
      })
      const reflector = { getAllAndOverride: jest.fn(() => declaration) }
      const verifier = {
        verify: jest.fn(async () => ({
          issuer: 'https://auth.local.oes.example',
          audience: PERMISSION_AUDIENCE,
          subject: 'account-1',
          clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          tokenId: 'token-1',
          issuedAt: 1,
          notBefore: 1,
          expiresAt: 2,
          certificateThumbprint: 'A'.repeat(43),
          principalType: 'HUMAN',
          permissionCodes: ['permission.internal.account_navigation.resolve'],
          sessionTerminal: terminal
        }))
      }
      const identity = {
        getVerifiedWorkloadIdentity: jest.fn(async () => ({
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          certificateThumbprint: 'A'.repeat(43)
        }))
      }
      const handler = jest.fn()
      const context = {
        getHandler: jest.fn(() => handler),
        getClass: jest.fn(),
        getArgByIndex: jest.fn(() => ({ getAuthContext: jest.fn() })),
        switchToRpc: jest.fn(() => ({ getContext: () => metadata, getData: () => data }))
      }
      const guard = new PermissionFoundationTrustedExecutionGuard(
        reflector as never,
        verifier as never,
        identity as never
      )

      const decision = guard.canActivate(context as never)
      if (allowed) await expect(decision).resolves.toBe(true)
      else
        await expect(decision).rejects.toThrow(
          'Permission HUMAN execution terminal is not permitted'
        )
    }
  )

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
