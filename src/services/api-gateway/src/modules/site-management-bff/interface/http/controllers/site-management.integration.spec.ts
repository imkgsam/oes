import { createServer } from 'node:net'
import { Metadata } from '@grpc/grpc-js'
import { Controller, INestApplication, INestMicroservice, Module, UseFilters } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { GrpcMethod, MicroserviceOptions, RpcException, Transport } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import request from 'supertest'
import { AuthorizationModule, GatewayPermissionGuard, GRPC_METADATA_PROPAGATION_FACTORY } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonContractPath, resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { GrpcTransportModule } from '@oes/common/transport'
import { GrpcExceptionFilter } from '../../../../../../../../common/dist/core/filters'
import { GatewayExceptionFilter } from '../../../../../common/filters/gateway-exception.filter'
import { GatewaySessionAuthGuard } from '../../../../../common/guards/gateway-session-auth.guard'
import { GatewayVerifiedSourceCredentialVault } from '../../../../../common/grpc/gateway-verified-source-credential.vault'
import { TenantTargetBindingGuard } from '../../../../../common/tenant-target'
import { AuthGrpcAdapter } from '../../../../auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { TrustedAuthApiKeyGrpcClient } from '../../../../auth-bff/infrastructure/downstream/auth-service/trusted-auth-api-key.grpc.client'
import {
  SITE_MANAGEMENT_DOWNSTREAM,
  SiteManagementDownstream,
  SiteManagementService
} from '../../../site-management.service'
import { SiteManagementController } from './site-management.controller'
import { createGatewayGuardProviders } from '../../../../../security'

const LOOPBACK_HOST = '127.0.0.1'
const HISTORICAL_FIXED_PORTS = [56170, 56171] as const
const COMMON_CONTRACTS_ROOT = resolveCommonContractPath()

type SessionFixture = {
  accountId: string
  scopeLevel: string
  sessionId: string
  tenantId?: string
  userId: string
}

type AsyncCloseable = {
  close(): void | Promise<void>
}

const sessions = new Map<string, SessionFixture>([
  [
    'tenant-match',
    {
      accountId: 'operator_a',
      scopeLevel: 'TENANT',
      sessionId: 'session_match',
      tenantId: ' tenant_a ',
      userId: 'user_a'
    }
  ],
  [
    'tenant-mismatch',
    {
      accountId: 'operator_a',
      scopeLevel: 'TENANT',
      sessionId: 'session_mismatch',
      tenantId: 'tenant_a',
      userId: 'user_a'
    }
  ],
  [
    'tenant-missing',
    {
      accountId: 'operator_a',
      scopeLevel: 'TENANT',
      sessionId: 'session_missing_tenant',
      tenantId: '   ',
      userId: 'user_a'
    }
  ],
  [
    'system-session',
    {
      accountId: 'system_operator',
      scopeLevel: 'SYSTEM',
      sessionId: 'session_system',
      userId: 'system_user'
    }
  ]
])

const observed = {
  authCalls: 0,
  events: [] as string[],
  permissionCalls: [] as string[],
  uploadFrames: [] as unknown[]
}

let permissionAllowed = true

function providerName(value: unknown): string | undefined { return typeof value === 'function' ? value.name : undefined }

/** reserveIsolatedLoopbackPorts allocates distinct ephemeral loopback ports using the repository acceptance-test pattern. */
async function reserveIsolatedLoopbackPorts(count: number): Promise<number[]> {
  if (!Number.isSafeInteger(count) || count < 1 || count > 16) {
    throw new Error('integration port count must be an integer from 1 through 16')
  }

  const maxAttempts = Math.max(16, count * 8)
  const ports = new Set<number>()
  for (let attempt = 0; attempt < maxAttempts && ports.size < count; attempt += 1) {
    ports.add(await reserveOneLoopbackPort())
  }
  if (ports.size !== count) {
    throw new Error(`Could not reserve ${count} distinct integration ports`)
  }
  return [...ports]
}

/** reserveOneLoopbackPort asks the kernel for one unused loopback TCP port and releases it cleanly. */
function reserveOneLoopbackPort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer()
    server.unref()
    server.once('error', rejectPort)
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        rejectPort(new Error('kernel did not return an isolated loopback port'))
        return
      }
      server.close((error) => {
        if (error) {
          rejectPort(error)
          return
        }
        resolvePort(address.port)
      })
    })
  })
}

/** TestAuthGrpcController exposes only session validation needed by the production gateway auth guard. */
@Controller()
@UseFilters(GrpcExceptionFilter)
class TestAuthGrpcController {
  /** validateAccessToken returns deterministic session truth or the production invalid-token error shape. */
  @GrpcMethod('AuthService', 'ValidateAccessToken')
  validateAccessToken(input: { accessToken?: string }) {
    observed.authCalls += 1
    observed.events.push('auth')
    const session = sessions.get(input.accessToken ?? '')

    if (!session) {
      throw new RpcException({
        grpcStatus: 16,
        code: 'AUTH_ACCESS_TOKEN_INVALID',
        message: 'Access token is invalid or expired'
      })
    }

    return session
  }
}

/** TestPermissionGrpcController records production permission-guard calls and returns a configurable decision. */
@Controller()
class TestPermissionGrpcController {
  /** checkPermission captures the coarse-grained permission decision boundary. */
  @GrpcMethod('PermissionCheckService', 'CheckPermission')
  checkPermission(input: { permissionCode?: string }) {
    observed.events.push('permission')
    observed.permissionCalls.push(input.permissionCode ?? '')
    return { allowed: permissionAllowed }
  }
}

/** TestAuthGrpcModule hosts the auth-service double used by the gateway HTTP composition. */
@Module({
  imports: [LoggingModule.forRoot({ serviceName: 'auth-service-site-management-test' })],
  controllers: [TestAuthGrpcController]
})
class TestAuthGrpcModule {}

/** TestPermissionGrpcModule hosts the permission-service double used by the gateway HTTP composition. */
@Module({
  controllers: [TestPermissionGrpcController]
})
class TestPermissionGrpcModule {}

const downstream: Partial<jest.Mocked<SiteManagementDownstream>> = {
  uploadSiteMedia: jest.fn((stream, _source) => new Promise((resolve, reject) => stream.subscribe({ next: (frame) => observed.uploadFrames.push(frame), error: reject, complete: () => resolve({ operationId: 'upload-1' }) }))),
  listSiteCards: jest.fn(async (context, _source) => {
    observed.events.push('downstream')
    return { cards: [], tenantId: context.tenantId }
  })
}

/** createTestGatewayAppModule injects kernel-allocated gRPC endpoints before Nest compiles the test graph. */
function createTestGatewayAppModule(authPort: number, permissionPort: number) {
  /** DynamicTestGatewayAppModule installs production guards around the real Site Management stack. */
  @Module({
    imports: [
      AuthorizationModule,
      LoggingModule.forRoot({ serviceName: 'api-gateway-site-management-test' }),
      GrpcTransportModule.forRoot({
        services: {
          [SERVICE_NAMES.AUTH]: {
            serviceName: SERVICE_NAMES.AUTH,
            protoPath: [resolveCommonProtoPath('auth_service/auth.proto'), resolveCommonProtoPath('auth_service/external_api_key.proto')],
            packageName: 'auth_service',
            url: `${LOOPBACK_HOST}:${authPort}`
          },
          [SERVICE_NAMES.PERMISSION]: {
            serviceName: SERVICE_NAMES.PERMISSION,
            protoPath: resolveCommonProtoPath('permission_service/permission_check.proto'),
            packageName: 'permission_service',
            loader: { includeDirs: [COMMON_CONTRACTS_ROOT] },
            url: `${LOOPBACK_HOST}:${permissionPort}`
          }
        }
      }),
      GrpcTransportModule.forFeature([SERVICE_NAMES.AUTH, SERVICE_NAMES.PERMISSION])
    ],
    controllers: [SiteManagementController],
    providers: [
      AuthGrpcAdapter,
      GatewayVerifiedSourceCredentialVault,
      { provide: GRPC_METADATA_PROPAGATION_FACTORY, useValue: { createInternalCallMetadata: jest.fn(() => new Metadata()), createOperatorScopedMetadata: jest.fn(() => new Metadata()) } },
      { provide: TrustedAuthApiKeyGrpcClient, useValue: { issueExchangeToken: jest.fn(), exchangeExternalApiKey: jest.fn() } },
      SiteManagementService,
      { provide: SITE_MANAGEMENT_DOWNSTREAM, useValue: downstream },
      GatewayExceptionFilter,
      GatewayPermissionGuard,
      { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
      { provide: APP_GUARD, useClass: TenantTargetBindingGuard },
      { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
    ]
  })
  class DynamicTestGatewayAppModule {}

  return DynamicTestGatewayAppModule
}

/** Site Management integration tests lock the production auth, tenant binding, permission, and downstream order. */
describe('Site Management tenant-target binding integration', () => {
  let app: INestApplication
  let authMicroservice: INestMicroservice
  let permissionMicroservice: INestMicroservice
  let siteManagementService: SiteManagementService
  let listSiteCardsHandler: jest.SpyInstance
  let authPort = 0
  let permissionPort = 0
  const resources: AsyncCloseable[] = []

  /** closeIntegrationResources closes every started resource in reverse order even when one close fails. */
  async function closeIntegrationResources(): Promise<void> {
    const closeErrors: unknown[] = []
    for (const resource of resources.splice(0).reverse()) {
      try {
        await resource.close()
      } catch (error) {
        closeErrors.push(error)
      }
    }
    if (closeErrors.length > 0) {
      throw new AggregateError(closeErrors, 'Site Management integration cleanup failed')
    }
  }

  beforeAll(async () => {
    const allocatedPorts = await reserveIsolatedLoopbackPorts(2)
    authPort = allocatedPorts[0]
    permissionPort = allocatedPorts[1]

    try {
      authMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
        TestAuthGrpcModule,
        {
          transport: Transport.GRPC,
          options: {
            package: 'auth_service',
            protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
            url: `${LOOPBACK_HOST}:${authPort}`
          }
        }
      )
      resources.push(authMicroservice)
      await authMicroservice.listen()

      permissionMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
        TestPermissionGrpcModule,
        {
          transport: Transport.GRPC,
          options: {
            package: 'permission_service',
            protoPath: resolveCommonProtoPath('permission_service/permission_check.proto'),
            loader: { includeDirs: [COMMON_CONTRACTS_ROOT] },
            url: `${LOOPBACK_HOST}:${permissionPort}`
          }
        }
      )
      resources.push(permissionMicroservice)
      await permissionMicroservice.listen()

      const TestGatewayAppModule = createTestGatewayAppModule(authPort, permissionPort)
      const moduleRef = await Test.createTestingModule({
        imports: [TestGatewayAppModule]
      }).compile()
      try {
        app = moduleRef.createNestApplication()
      } catch (error) {
        await moduleRef.close()
        throw error
      }
      resources.push(app)
      app.setGlobalPrefix('api/v1')
      app.useGlobalFilters(app.get(GatewayExceptionFilter))
      await app.init()
      siteManagementService = app.get(SiteManagementService)
      listSiteCardsHandler = jest.spyOn(siteManagementService, 'listSiteCards')
    } catch (startError) {
      try {
        await closeIntegrationResources()
      } catch (cleanupError) {
        throw new AggregateError(
          [startError, cleanupError],
          'Site Management integration startup and cleanup both failed',
          { cause: startError }
        )
      }
      throw startError
    }
  })

  afterAll(async () => {
    await closeIntegrationResources()
  })

  beforeEach(() => {
    observed.authCalls = 0
    observed.events = []
    observed.permissionCalls = []
    observed.uploadFrames = []
    permissionAllowed = true
    jest.clearAllMocks()
  })

  it('registers the production APP_GUARD order as session, tenant binding, then permission', () => {
    const providers = createGatewayGuardProviders() as unknown as Array<Record<string, unknown>>
    const sessionIndex = providers.findIndex(
      (provider) => provider?.provide === APP_GUARD && (provider?.useClass === GatewaySessionAuthGuard || providerName(provider?.useClass) === GatewaySessionAuthGuard.name)
    )
    const bindingIndex = providers.findIndex(
      (provider) => provider?.provide === APP_GUARD && (provider?.useClass === TenantTargetBindingGuard || providerName(provider?.useClass) === TenantTargetBindingGuard.name)
    )
    const permissionIndex = providers.findIndex(
      (provider) => provider?.provide === APP_GUARD && (provider?.useExisting === GatewayPermissionGuard || providerName(provider?.useExisting) === GatewayPermissionGuard.name)
    )

    expect(sessionIndex).toBeGreaterThanOrEqual(0)
    expect(bindingIndex).toBeGreaterThan(sessionIndex)
    expect(permissionIndex).toBeGreaterThan(bindingIndex)
  })

  it('uses kernel-allocated ports instead of the historical fixed integration ports', () => {
    expect([authPort, permissionPort]).not.toEqual([...HISTORICAL_FIXED_PORTS])
    expect(new Set([authPort, permissionPort]).size).toBe(2)
    expect(authPort).toBeGreaterThan(0)
    expect(permissionPort).toBeGreaterThan(0)
  })

  it('returns 401 before permission and downstream when the bearer token is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_a/sites')
      .expect(401)

    expect(observed.authCalls).toBe(0)
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('returns 401 before permission and downstream when auth-service rejects the session', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_a/sites')
      .set('Authorization', 'Bearer invalid-session')
      .expect(401)

    expect(observed.authCalls).toBe(1)
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('returns 401 for a TENANT session without a valid tenant before permission and downstream', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_a/sites')
      .set('Authorization', 'Bearer tenant-missing')
      .expect(401)

    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('passes the normalized verified tenant target into downstream after permission', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/%20tenant_a%20/sites')
      .set('Authorization', 'Bearer tenant-match')
      .expect(200)

    expect(response.body).toEqual({ cards: [], tenantId: 'tenant_a' })
    expect(observed.events).toEqual(['auth', 'permission', 'downstream'])
    expect(observed.permissionCalls).toHaveLength(1)
    expect(listSiteCardsHandler).toHaveBeenCalledWith('tenant_a', expect.any(Object))
    expect(downstream.listSiteCards).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant_a' }),
      expect.any(Object)
    )
  })

  it('constructs the upload start frame from the URL site and bounded HTTP stream', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/site-management/tenants/tenant_a/sites/site_a/media')
      .set('Authorization', 'Bearer tenant-match')
      .set('x-idempotency-key', 'upload-http-1')
      .set('x-oes-media-kind', 'IMAGE')
      .set('Content-Type', 'image/png')
      .send(Buffer.from('bounded-media'))
      .expect(201)
    expect(observed.uploadFrames[0]).toEqual(expect.objectContaining({ start: expect.objectContaining({ siteId: 'site_a', idempotencyKey: 'upload-http-1', requestedMediaKind: 'IMAGE', declaredContentType: 'image/png' }) }))
    expect(observed.uploadFrames.slice(1).every((frame) => !('start' in (frame as object)))).toBe(true)
  })

  it('returns 403 on tenant mismatch before permission, handler, or downstream', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_b/sites')
      .set('Authorization', 'Bearer tenant-mismatch')
      .expect(403)

    expect(JSON.stringify(response.body)).not.toContain('tenant_a')
    expect(JSON.stringify(response.body)).not.toContain('tenant_b')
    expect(observed.events).toEqual(['auth'])
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('returns 403 for SYSTEM before permission and downstream even when permission would allow', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_a/sites')
      .set('Authorization', 'Bearer system-session')
      .expect(403)

    expect(observed.events).toEqual(['auth'])
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('returns 400 for an illegal matched target before permission and downstream', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant%40a/sites')
      .set('Authorization', 'Bearer tenant-match')
      .expect(400)

    expect(observed.events).toEqual(['auth'])
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('returns 404 without running guards when the tenant path segment is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants')
      .set('Authorization', 'Bearer tenant-match')
      .expect(404)

    expect(observed.events).toEqual([])
    expect(observed.permissionCalls).toEqual([])
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })

  it('protects local locale-options before permission or handler execution on mismatch', async () => {
    const handler = jest.spyOn(siteManagementService, 'listLocaleOptions')

    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_b/locale-options')
      .set('Authorization', 'Bearer tenant-mismatch')
      .expect(403)

    expect(observed.events).toEqual(['auth'])
    expect(observed.permissionCalls).toEqual([])
    expect(handler).not.toHaveBeenCalled()
  })

  it('runs permission only after a successful tenant binding and stops before downstream on deny', async () => {
    permissionAllowed = false

    await request(app.getHttpServer())
      .get('/api/v1/site-management/tenants/tenant_a/sites')
      .set('Authorization', 'Bearer tenant-match')
      .expect(403)

    expect(observed.events).toEqual(['auth', 'permission'])
    expect(observed.permissionCalls).toHaveLength(1)
    expect(listSiteCardsHandler).not.toHaveBeenCalled()
    expect(downstream.listSiteCards).not.toHaveBeenCalled()
  })
})
