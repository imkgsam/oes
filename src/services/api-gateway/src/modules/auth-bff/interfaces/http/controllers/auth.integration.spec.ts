import { Controller, Module, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { INestApplication, INestMicroservice } from '@nestjs/common'
import { GrpcMethod, MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { APP_GUARD } from '@nestjs/core'
import request from 'supertest'
import { ConfigModule } from '@nestjs/config'
import { CommonJwtModule, CommonJwtService, GatewayJwtAuthGuard } from '@oes/common/auth'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthBffModule } from '../../../auth-bff.module'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  LoginStatus
} from '@oes/common/generated/auth_service'
import {
  PermissionCheckServiceController,
  PermissionCheckServiceControllerMethods
} from '@oes/common/generated/permission_service'

const AUTH_PORT = 56050
const PERMISSION_PORT = 56051
const IDENTITY_PORT = 56052

type ObservedCallState = {
  listSessionsCurrentSessionId?: string
  adminListUserSessionsOperatorContext?: string
  checkedPermissions: string[]
}

const observedState: ObservedCallState = {
  checkedPermissions: []
}

const allowedPermissions = new Set<string>()

// Implements the downstream auth-service gRPC contract used by the auth-bff integration test.
@Controller()
@AuthServiceControllerMethods()
class TestAuthGrpcController implements AuthServiceController {
  listAuditEvents(): any {
    return { items: [{ eventId: 'audit-1', eventType: 'SESSION_REVOKED', tenantId: 'tenant-1' }], nextCursor: '' }
  }

  loginWithEmailPassword(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
      challengeId: 'challenge-1',
      loginMethod: 'EMAIL_PASSWORD'
    }
  }

  requestEmailOtpLoginChallenge(): any {
    return { challengeId: 'email-challenge-1', destination: 'a***@example.com' }
  }

  loginWithEmailOtp(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'EMAIL_OTP'
    }
  }

  loginWithPhonePassword(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'PHONE_PASSWORD'
    }
  }

  requestPhoneOtpLoginChallenge(): any {
    return { challengeId: 'phone-challenge-1', destination: '+86******0000' }
  }

  loginWithPhoneOtp(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: '3600',
      loginMethod: 'PHONE_OTP'
    }
  }

  listMfaBindings(): any {
    return { bindings: [] }
  }

  enableMfaBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 1, enabled: true, available: true } }
  }

  disableMfaBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 1, enabled: false, available: true } }
  }

  initializeTotpBinding(): any {
    return {
      binding: { bindingId: 'binding-1', type: 3, enabled: false, available: true },
      secret: 'secret-1',
      qrCodeUrl: 'otpauth://totp/test'
    }
  }

  activateTotpBinding(): any {
    return { success: true, binding: { bindingId: 'binding-1', type: 3, enabled: true, available: true } }
  }

  initializeRecoveryCodes(): any {
    return {
      binding: { bindingId: 'binding-1', type: 4, enabled: true, available: true },
      recoveryCodes: ['code-1']
    }
  }

  regenerateRecoveryCodes(): any {
    return {
      binding: { bindingId: 'binding-1', type: 4, enabled: true, available: true },
      recoveryCodes: ['code-2']
    }
  }

  submitMfaChallenge(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
      userId: 'user-1',
      accounts: [{ accountId: 'account-1', tenantId: 'tenant-1', displayName: 'Primary account' }],
      loginMethod: 'EMAIL_PASSWORD'
    }
  }

  refreshSession(): any {
    return {
      sessionId: 'session-1',
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresIn: '3600'
    }
  }

  selectAccount(): any {
    return {
      status: LoginStatus.LOGIN_STATUS_SUCCESS,
      userId: 'user-1',
      accountId: 'account-1',
      tenantId: 'tenant-1',
      displayName: 'Primary account',
      sessionId: 'session-1',
      accessToken: 'access-3',
      refreshToken: 'refresh-3',
      expiresIn: '3600'
    }
  }

  listSessions(request: { currentSessionId?: string }): any {
    observedState.listSessionsCurrentSessionId = request.currentSessionId ?? undefined
    return {
      sessions: [
        {
          sessionId: 'session-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          loginMethod: 'EMAIL_PASSWORD',
          createdAt: '2026-04-09T10:00:00.000Z',
          lastActiveAt: '2026-04-09T10:10:00.000Z',
          expiresAt: '2026-04-09T11:00:00.000Z',
          refreshExpiresAt: '2026-04-10T10:00:00.000Z',
          accessRemainingSeconds: '300',
          refreshRemainingSeconds: '86400',
          sessionAgeSeconds: '600',
          idleSeconds: '30',
          isAccessExpired: false,
          isRefreshExpired: false,
          isRevoked: false,
          isCurrent: true,
          isAdminControlled: false
        }
      ]
    }
  }

  adminListUserSessions(
    request: { userId?: string },
    metadata?: { getMap?: () => Record<string, unknown> }
  ): any {
    const map = metadata?.getMap?.() ?? {}
    observedState.adminListUserSessionsOperatorContext = String(map['x-operator-context'] ?? '')

    return {
      sessions: [
        {
          sessionId: 'session-admin-1',
          userId: request.userId ?? '',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          loginMethod: 'EMAIL_PASSWORD',
          createdAt: '2026-04-09T10:00:00.000Z',
          lastActiveAt: '2026-04-09T10:10:00.000Z',
          expiresAt: '2026-04-09T11:00:00.000Z',
          refreshExpiresAt: '2026-04-10T10:00:00.000Z',
          accessRemainingSeconds: '300',
          refreshRemainingSeconds: '86400',
          sessionAgeSeconds: '600',
          idleSeconds: '30',
          isAccessExpired: false,
          isRefreshExpired: false,
          isRevoked: false,
          isAdminControlled: true
        }
      ]
    }
  }

  adminRevokeSession(request: { sessionId?: string }): any {
    return { success: true, sessionId: request.sessionId ?? '' }
  }

  logout(): any {
    return { success: true }
  }

  logoutOtherDevices(): any {
    return { success: true, sessionCount: '2' }
  }

  logoutAll(): any {
    return { success: true, sessionCount: '3' }
  }
}

// Implements the downstream permission-service gRPC contract used by gateway permission checks in the integration test.
@Controller()
@PermissionCheckServiceControllerMethods()
class TestPermissionGrpcController implements PermissionCheckServiceController {
  checkPermission(request: { permissionCode?: string }) {
    const code = request.permissionCode ?? ''
    observedState.checkedPermissions.push(code)
    return { allowed: allowedPermissions.has(code) }
  }

  batchCheckPermission() {
    return { decisions: [] }
  }

  checkPermissionWithContext() {
    return { allowed: false }
  }

  @GrpcMethod('PermissionAccessSummaryService', 'GetAccountAccessSummary')
  getAccountAccessSummary(request: { accountId?: string; tenantId?: string }) {
    return {
      roles: [
        {
          roleId: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          tenantId: request.tenantId ?? '',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['permission.list', 'role.create']
    }
  }
}

// Implements the downstream identity-service gRPC contract used by the session-context integration test.
@Controller()
class TestIdentityGrpcController {
  @GrpcMethod('IdentityQueryService', 'GetAccountById')
  getAccountById(request: { accountId?: string }) {
    return {
      account: {
        id: request.accountId ?? '',
        userId: 'user-1',
        tenantId: 'tenant-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        isEnabled: true
      }
    }
  }

  @GrpcMethod('IdentityQueryService', 'GetTenantById')
  getTenantById(request: { tenantId?: string }) {
    return {
      tenant: {
        id: request.tenantId ?? '',
        code: 'meilong',
        name: 'Meilong Ceramics',
        isActive: true
      }
    }
  }
}

// Hosts the test auth-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestAuthGrpcController]
})
class TestAuthGrpcModule {}

// Hosts the test permission-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestPermissionGrpcController]
})
class TestPermissionGrpcModule {}

// Hosts the test identity-service gRPC controller used by the gateway integration harness.
@Module({
  controllers: [TestIdentityGrpcController]
})
class TestIdentityGrpcModule {}

// Hosts the minimal gateway application wiring needed to run auth-bff HTTP to gRPC integration tests.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule.forRoot({ serviceName: 'api-gateway-test' }),
    CommonJwtModule,
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.AUTH]: {
          serviceName: SERVICE_NAMES.AUTH,
          protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
          packageName: 'auth_service',
          url: `127.0.0.1:${AUTH_PORT}`
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          packageName: 'permission_service',
          url: `127.0.0.1:${PERMISSION_PORT}`
        },
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url: `127.0.0.1:${IDENTITY_PORT}`
        }
      }
    }),
    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION]),
    AuthBffModule
  ],
  providers: [
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: GatewayJwtAuthGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard }
  ]
})
class TestGatewayAppModule {}

// Verifies the auth-bff HTTP routes can traverse the real gateway HTTP and gRPC stack into downstream services.
describe('AuthBff gateway integration', () => {
  let app: INestApplication
  let authMicroservice: INestMicroservice
  let permissionMicroservice: INestMicroservice
  let identityMicroservice: INestMicroservice
  let jwtService: CommonJwtService

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.ACCESS_TOKEN_VALIDITY_SEC = '3600'
    process.env.REFRESH_TOKEN_VALIDITY_SEC = '86400'
    authMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(TestAuthGrpcModule, {
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
        url: `127.0.0.1:${AUTH_PORT}`
      }
    })

    permissionMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestPermissionGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'permission_service',
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          url: `127.0.0.1:${PERMISSION_PORT}`
        }
      }
    )

    await authMicroservice.listen()
    await permissionMicroservice.listen()
    identityMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(
      TestIdentityGrpcModule,
      {
        transport: Transport.GRPC,
        options: {
          package: 'identity_service',
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          url: `127.0.0.1:${IDENTITY_PORT}`
        }
      }
    )

    await identityMicroservice.listen()

    const moduleRef = await Test.createTestingModule({
      imports: [TestGatewayAppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'health/ready', 'docs', 'docs-json']
    })
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true
      })
    )
    await app.init()

    jwtService = app.get(CommonJwtService)
  })

  afterAll(async () => {
    await app?.close()
    await authMicroservice?.close()
    await permissionMicroservice?.close()
    await identityMicroservice?.close()
  })

  beforeEach(() => {
    observedState.listSessionsCurrentSessionId = undefined
    observedState.adminListUserSessionsOperatorContext = undefined
    observedState.checkedPermissions = []
    allowedPermissions.clear()
  })

  it('routes the public login endpoint through the real gRPC auth downstream', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        method: 'EMAIL_PASSWORD',
        identifier: 'alice@example.com',
        credential: 'secret-1'
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        nextStep: 'COMPLETE_MFA',
        loginMethod: 'EMAIL_PASSWORD',
        challenge: expect.objectContaining({ challengeId: 'challenge-1' })
      })
    )
  })

  it('routes self-service session queries through the real gRPC auth downstream using JWT context', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        isCurrent: true
      })
    )
    expect(observedState.listSessionsCurrentSessionId).toBe('session-1')
  })

  it('routes authenticated shell context queries through auth-bff into identity-service summaries', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      aid: 'account-1',
      tid: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/session/context')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({
      operator: {
        userId: 'user-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      account: {
        accountId: 'account-1',
        name: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      tenant: {
        tenantId: 'tenant-1',
        name: 'Meilong Ceramics'
      },
      org: null,
      navigation: {
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home'],
        defaultHomePath: '/workbench/home',
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: 'TENANT'
    })
  })

  it('routes access-summary queries through auth-bff into permission-service summaries', async () => {
    const token = jwtService.signAccessToken({
      sub: 'user-1',
      userId: 'user-1',
      holderId: 'account-1',
      tenantId: 'tenant-1',
      aid: 'account-1',
      tid: 'tenant-1',
      sid: 'session-1'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/session/access-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body).toEqual({
      roles: [
        {
          roleId: 'role-1',
          code: 'tenant.admin',
          name: 'Tenant Admin',
          tenantId: 'tenant-1',
          scope: 'TENANT'
        }
      ],
      actionCodes: ['permission.list', 'role.create']
    })
  })

  it('routes admin session queries through gateway permission checks and operator-scoped downstream metadata', async () => {
    allowedPermissions.add('auth.session.admin.view')

    const token = jwtService.signAccessToken({
      sub: 'operator-user-1',
      holderId: 'account-admin-1',
      userId: 'operator-user-1',
      tenantId: 'tenant-1',
      sid: 'session-admin-1',
      roles: ['tenant-admin'],
      typ: 'USER'
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/admin/users/user-1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(observedState.checkedPermissions).toContain('auth.session.admin.view')
    expect(observedState.adminListUserSessionsOperatorContext).toContain('operator_id')
    expect(response.body.sessions[0]).toEqual(
      expect.objectContaining({
        sessionId: 'session-admin-1',
        userId: 'user-1',
        isAdminControlled: true
      })
    )
  })
})
