import 'reflect-metadata'

import { join } from 'node:path'

import {
  Controller,
  Module,
  UseFilters,
  ValidationPipe,
  type INestApplication,
  type INestMicroservice
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  GrpcMethod,
  type MicroserviceOptions,
  RpcException,
  Transport
} from '@nestjs/microservices'

import { GatewayPermissionGuard } from '../../../common/dist/authorization'
import { SERVICE_NAMES } from '../../../common/dist/constants'
import { GrpcExceptionFilter } from '../../../common/dist/core/filters'
import { LoggingModule } from '../../../common/dist/logging'
import { GrpcTransportModule } from '../../../common/dist/transport'
import { GatewayExceptionFilter } from '../../../services/api-gateway/dist/common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from '../../../services/api-gateway/dist/common/interceptors/response.interceptor'
import { AuthGrpcAdapter } from '../../../services/api-gateway/dist/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { SiteManagementBffModule } from '../../../services/api-gateway/dist/modules/site-management-bff/site-management-bff.module'
import { SiteRuntimeBffModule } from '../../../services/api-gateway/dist/modules/site-runtime-bff/site-runtime-bff.module'
import { createGatewayGuardProviders } from '../../../services/api-gateway/dist/security'
import {
  type ManagedResourceStartOptions,
  startManagedResource
} from './locale-governance-acceptance-harness'

const REPOSITORY_ROOT = join(__dirname, '../../../..')
const SITE_PROTO_PATH = join(REPOSITORY_ROOT, 'src/common/src/contracts/site_service/site.proto')
const AUTH_PROTO_PATH = join(REPOSITORY_ROOT, 'src/common/src/contracts/auth_service/auth.proto')
const PERMISSION_PROTO_PATH = join(
  REPOSITORY_ROOT,
  'src/common/src/contracts/permission_service/permission_check.proto'
)
const LOOPBACK_HOST = '127.0.0.1'

export interface AcceptanceGatewayIdentity {
  readonly accessToken: string
  readonly tenantId?: string
  readonly accountId: string
  readonly userId: string
  readonly sessionId: string
  readonly scopeLevel: 'TENANT' | 'SYSTEM'
}

export interface PermissionCheckObservation {
  readonly accountId: string
  readonly permissionCode: string
  readonly callerServiceName: string
}

export interface AcceptanceGatewayObservations {
  readonly authTokens: readonly string[]
  readonly permissionChecks: readonly PermissionCheckObservation[]
}

export interface GatewayHarnessModuleInput {
  readonly siteGrpcUrl: string
  readonly authGrpcUrl: string
  readonly permissionGrpcUrl: string
}

interface AcceptanceGatewayDoubleState {
  identity: AcceptanceGatewayIdentity
  authTokens: string[]
  permissionChecks: PermissionCheckObservation[]
  allowedPermissions: Set<string>
}

const acceptanceGatewayDoubleState: AcceptanceGatewayDoubleState = {
  identity: {
    accessToken: '',
    accountId: '',
    userId: '',
    sessionId: '',
    scopeLevel: 'TENANT'
  },
  authTokens: [],
  permissionChecks: [],
  allowedPermissions: new Set<string>()
}

/** acceptanceGatewayGuardProviderFactory keeps acceptance composition on the exact production-owned guard factory. */
export const acceptanceGatewayGuardProviderFactory = createGatewayGuardProviders

/** AcceptanceAuthGrpcController implements only auth-service ValidateAccessToken for production Gateway guard coverage. */
@Controller()
@UseFilters(GrpcExceptionFilter)
class AcceptanceAuthGrpcController {
  /** validateAccessToken returns one configured session identity or the production invalid-token error shape. */
  @GrpcMethod('AuthService', 'ValidateAccessToken')
  validateAccessToken(request: { accessToken?: string }) {
    const accessToken = request.accessToken ?? ''
    acceptanceGatewayDoubleState.authTokens.push(accessToken)
    const identity = acceptanceGatewayDoubleState.identity
    if (!accessToken || accessToken !== identity.accessToken) {
      throw new RpcException({
        grpcStatus: 16,
        code: 'AUTH_ACCESS_TOKEN_INVALID',
        message: 'Access token is invalid or expired'
      })
    }
    return {
      userId: identity.userId,
      accountId: identity.accountId,
      tenantId: identity.tenantId,
      sessionId: identity.sessionId,
      scopeLevel: identity.scopeLevel,
      roleIds: ['locale-governance-acceptance'],
      passwordSetupRequired: false,
      terminal: 'WEB',
      allowedTerminals: ['WEB'],
      displayName: 'Locale Governance Acceptance Operator'
    }
  }
}

/** AcceptancePermissionGrpcController implements only CheckPermission and records its coarse Gateway contract. */
@Controller()
class AcceptancePermissionGrpcController {
  /** checkPermission records account and permission only, leaving tenant isolation to the binding guard. */
  @GrpcMethod('PermissionCheckService', 'CheckPermission')
  checkPermission(
    request: { accountId?: string; permissionCode?: string },
    metadata?: { getMap(): Record<string, unknown> }
  ) {
    const permissionCode = request.permissionCode ?? ''
    const map = metadata?.getMap() ?? {}
    acceptanceGatewayDoubleState.permissionChecks.push({
      accountId: request.accountId ?? '',
      permissionCode,
      callerServiceName: String(map['x-internal-service-name'] ?? '')
    })
    return {
      allowed: acceptanceGatewayDoubleState.allowedPermissions.has(permissionCode)
    }
  }
}

/** AcceptanceAuthGrpcModule hosts the single auth-service method required by the production session guard. */
@Module({ controllers: [AcceptanceAuthGrpcController] })
class AcceptanceAuthGrpcModule {}

/** AcceptancePermissionGrpcModule hosts the single permission-service method required by the production permission guard. */
@Module({ controllers: [AcceptancePermissionGrpcController] })
class AcceptancePermissionGrpcModule {}

/** configureAcceptanceGatewayDoubles resets one session and explicit permission allow-list for an isolated scenario. */
export function configureAcceptanceGatewayDoubles(
  identity: AcceptanceGatewayIdentity,
  allowedPermissions: readonly string[]
): void {
  acceptanceGatewayDoubleState.identity = { ...identity }
  acceptanceGatewayDoubleState.authTokens.length = 0
  acceptanceGatewayDoubleState.permissionChecks.length = 0
  acceptanceGatewayDoubleState.allowedPermissions = new Set(allowedPermissions)
}

/** readAcceptanceGatewayObservations returns immutable copies of guard boundary observations. */
export function readAcceptanceGatewayObservations(): AcceptanceGatewayObservations {
  return {
    authTokens: [...acceptanceGatewayDoubleState.authTokens],
    permissionChecks: acceptanceGatewayDoubleState.permissionChecks.map((observation) => ({
      ...observation
    }))
  }
}

/** createGatewayHarnessModule assembles production guards and Site BFF modules over real gRPC client pools. */
export function createGatewayHarnessModule(input: GatewayHarnessModuleInput) {
  /** LocaleGovernanceGatewayHarnessModule owns only acceptance transport assembly and no business behavior. */
  @Module({
    imports: [
      LoggingModule.forRoot({
        serviceName: 'locale-governance-acceptance-gateway'
      }),
      GrpcTransportModule.forRoot({
        services: {
          [SERVICE_NAMES.SITE]: {
            serviceName: SERVICE_NAMES.SITE,
            protoPath: SITE_PROTO_PATH,
            packageName: 'site_service',
            loader: { longs: String, arrays: true },
            url: input.siteGrpcUrl
          },
          [SERVICE_NAMES.AUTH]: {
            serviceName: SERVICE_NAMES.AUTH,
            protoPath: AUTH_PROTO_PATH,
            packageName: 'auth_service',
            url: input.authGrpcUrl
          },
          [SERVICE_NAMES.PERMISSION]: {
            serviceName: SERVICE_NAMES.PERMISSION,
            protoPath: PERMISSION_PROTO_PATH,
            packageName: 'permission_service',
            url: input.permissionGrpcUrl
          }
        },
        defaultPoolConfig: {
          minSize: 1,
          maxSize: 1,
          idleTimeoutMs: 10_000,
          acquireTimeoutMs: 5_000,
          healthCheckIntervalMs: 60_000
        }
      }),
      GrpcTransportModule.forFeature([SERVICE_NAMES.AUTH, SERVICE_NAMES.PERMISSION]),
      SiteManagementBffModule,
      SiteRuntimeBffModule
    ],
    providers: [
      AuthGrpcAdapter,
      GatewayPermissionGuard,
      ...acceptanceGatewayGuardProviderFactory(),
      GatewayExceptionFilter,
      ResponseTransformInterceptor
    ]
  })
  class LocaleGovernanceGatewayHarnessModule {}

  return LocaleGovernanceGatewayHarnessModule
}

/** startAuthServiceDouble starts the minimal real gRPC boundary consumed by GatewaySessionAuthGuard. */
export async function startAuthServiceDouble(
  grpcPort: number,
  options: ManagedResourceStartOptions = {}
): Promise<INestMicroservice> {
  return startManagedResource(
    (_signal) =>
      NestFactory.createMicroservice<MicroserviceOptions>(AcceptanceAuthGrpcModule, {
        logger: false,
        transport: Transport.GRPC,
        options: {
          package: 'auth_service',
          protoPath: AUTH_PROTO_PATH,
          url: `${LOOPBACK_HOST}:${grpcPort}`
        }
      }),
    async (service, _signal) => {
      await service.listen()
    },
    options
  )
}

/** startPermissionServiceDouble starts the minimal real gRPC boundary consumed by GatewayPermissionGuard. */
export async function startPermissionServiceDouble(
  grpcPort: number,
  options: ManagedResourceStartOptions = {}
): Promise<INestMicroservice> {
  return startManagedResource(
    (_signal) =>
      NestFactory.createMicroservice<MicroserviceOptions>(AcceptancePermissionGrpcModule, {
        logger: false,
        transport: Transport.GRPC,
        options: {
          package: 'permission_service',
          protoPath: PERMISSION_PROTO_PATH,
          url: `${LOOPBACK_HOST}:${grpcPort}`
        }
      }),
    async (service, _signal) => {
      await service.listen()
    },
    options
  )
}

/** createGateway creates the production-shaped HTTP application before its managed listen lifecycle begins. */
async function createGateway(
  siteGrpcPort: number,
  authGrpcPort: number,
  permissionGrpcPort: number
): Promise<INestApplication> {
  const gateway = await NestFactory.create(
    createGatewayHarnessModule({
      siteGrpcUrl: `${LOOPBACK_HOST}:${siteGrpcPort}`,
      authGrpcUrl: `${LOOPBACK_HOST}:${authGrpcPort}`,
      permissionGrpcUrl: `${LOOPBACK_HOST}:${permissionGrpcPort}`
    }),
    { logger: false, rawBody: true }
  )
  gateway.setGlobalPrefix('api/v1')
  gateway.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    })
  )
  gateway.useGlobalInterceptors(gateway.get(ResponseTransformInterceptor))
  gateway.useGlobalFilters(gateway.get(GatewayExceptionFilter))
  return gateway
}

/** startGateway starts production Site BFF modules, guards, filters, and response mapping on isolated HTTP. */
export async function startGateway(
  siteGrpcPort: number,
  authGrpcPort: number,
  permissionGrpcPort: number,
  gatewayPort: number,
  options: ManagedResourceStartOptions = {}
): Promise<INestApplication> {
  return startManagedResource(
    (_signal) => createGateway(siteGrpcPort, authGrpcPort, permissionGrpcPort),
    async (gateway, _signal) => {
      await gateway.listen(gatewayPort, LOOPBACK_HOST)
    },
    options
  )
}
