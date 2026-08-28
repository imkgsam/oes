import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonJwtModule } from '@oes/common/auth'
import {
  GATEWAY_PERMISSION_TRUSTED_METADATA_PROVIDER,
  GatewayPermissionGuard
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonContractPath, resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { createGatewayGuardProviders, createGatewaySourceCredentialProviders } from './security'
import { GatewayPermissionTrustedMetadata } from './common/grpc/gateway-permission-trusted-metadata.provider'
import { AuthBffModule } from './modules/auth-bff/auth-bff.module'
import { BrowserActivityBffModule } from './modules/browser-activity-bff/browser-activity-bff.module'
import { PdaBffModule } from './modules/pda-bff/pda-bff.module'
import { TerminalDeviceAdminBffModule } from './modules/terminal-device-admin-bff/terminal-device-admin-bff.module'
import { CollaborationServiceProxyModule } from './modules/collaboration-service/collaboration-service.module'
import { CrmServiceProxyModule } from './modules/crm-service/crm-service.module'
import { FinanceServiceProxyModule } from './modules/finance-service/finance-service.module'
import { HrServiceProxyModule } from './modules/hr-service/hr-service.module'
import { ItemMasterServiceProxyModule } from './modules/item-master-service/item-master-service.module'
import { MesServiceProxyModule } from './modules/mes-service/mes-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { ProcurementServiceProxyModule } from './modules/procurement-service/procurement-service.module'
import { PublicEntryServiceProxyModule } from './modules/public-entry-service/public-entry-service.module'
import { SalesServiceProxyModule } from './modules/sales-service/sales-service.module'
import { SiteManagementBffModule } from './modules/site-management-bff/site-management-bff.module'
import { SiteRuntimeBffModule } from './modules/site-runtime-bff/site-runtime-bff.module'
import { SrmServiceProxyModule } from './modules/srm-service/srm-service.module'
import { TenantOrgServiceProxyModule } from './modules/tenant-org-service/tenant-org-service.module'
import { WmsServiceProxyModule } from './modules/wms-service/wms-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { ExternalApiModule } from './common/external-api/external-api.module'
import { GatewayTrustedGrpcExecutionModule } from './common/grpc/gateway-trusted-grpc-execution.module'
import { GatewayFoundationTrustedGrpcModule } from './infrastructure/grpc/trusted-auth.grpc.client'

/** resolveTenantOrgGrpcUrl avoids localhost IPv6 ambiguity for the local tenant-org fallback endpoint. */
export function resolveTenantOrgGrpcUrl() {
  return process.env.TENANT_ORG_SERVICE_HOST && process.env.TENANT_ORG_SERVICE_PORT
    ? `${process.env.TENANT_ORG_SERVICE_HOST}:${process.env.TENANT_ORG_SERVICE_PORT}`
    : '127.0.0.1:50054'
}

/** resolveAuthGrpcUrl avoids localhost IPv6 ambiguity for the local auth-service endpoint. */
export function resolveAuthGrpcUrl() {
  const host = process.env.AUTH_SERVICE_HOST?.trim()
  const port = process.env.AUTH_SERVICE_PORT?.trim()

  if (host && port) {
    return `${normalizeLocalhostGrpcHost(host)}:${port}`
  }

  return (process.env.NODE_ENV ?? 'development') !== 'production' ? '127.0.0.1:50050' : undefined
}

/** resolveTerminalDeviceGrpcUrl centralizes the managed terminal-device gRPC endpoint for PDA/Admin BFFs. */
export function resolveTerminalDeviceGrpcUrl() {
  const host = process.env.TERMINAL_DEVICE_SERVICE_HOST?.trim()
  const port = process.env.TERMINAL_DEVICE_SERVICE_PORT?.trim()

  if (host && port) {
    return `${normalizeLocalhostGrpcHost(host)}:${port}`
  }

  return '127.0.0.1:50057'
}

/** resolveHrGrpcUrl avoids localhost IPv6 ambiguity for the local hr-service endpoint. */
export function resolveHrGrpcUrl() {
  const host = process.env.HR_SERVICE_HOST?.trim()
  const port = process.env.HR_SERVICE_PORT?.trim()

  if (host && port) {
    return `${normalizeLocalhostGrpcHost(host)}:${port}`
  }

  return (process.env.NODE_ENV ?? 'development') !== 'production' ? '127.0.0.1:50055' : undefined
}

/** resolveBrowserActivityGrpcUrl centralizes the local browser-activity-service endpoint used by api-gateway. */
export function resolveBrowserActivityGrpcUrl() {
  const host = process.env.BROWSER_ACTIVITY_SERVICE_HOST?.trim()
  const port = process.env.BROWSER_ACTIVITY_SERVICE_PORT?.trim()

  if (host && port) {
    return `${normalizeLocalhostGrpcHost(host)}:${port}`
  }

  return (process.env.NODE_ENV ?? 'development') !== 'production' ? '127.0.0.1:50070' : undefined
}

/** resolveMesGrpcUrl centralizes the local MES fallback endpoint used by api-gateway. */
export function resolveMesGrpcUrl() {
  return process.env.MES_SERVICE_HOST && process.env.MES_SERVICE_PORT
    ? `${process.env.MES_SERVICE_HOST}:${process.env.MES_SERVICE_PORT}`
    : 'localhost:50065'
}

/** resolveSiteGrpcUrl centralizes the local site-service endpoint used by Admin and Site-facing BFFs. */
export function resolveSiteGrpcUrl() {
  const host = process.env.SITE_SERVICE_HOST?.trim()
  const port = process.env.SITE_SERVICE_PORT?.trim()

  if (host && port) {
    return `${normalizeLocalhostGrpcHost(host)}:${port}`
  }

  return (process.env.NODE_ENV ?? 'development') !== 'production' ? '127.0.0.1:50069' : undefined
}

/** normalizeLocalhostGrpcHost maps local gRPC clients to IPv4 when services bind IPv4-only sockets. */
function normalizeLocalhostGrpcHost(host: string) {
  return host === 'localhost' ? '127.0.0.1' : host
}

/** permissionGrpcProtoPaths lists every permission-service contract used by api-gateway adapters. */
export const permissionGrpcProtoPaths = [
  resolveCommonProtoPath('permission_service/policy_management.proto'),
  resolveCommonProtoPath('permission_service/permission_management.proto'),
  resolveCommonProtoPath('permission_service/permission_check.proto'),
  resolveCommonProtoPath('permission_service/permission_access_summary.proto'),
  resolveCommonProtoPath('permission_service/policy_instance_management.proto'),
  resolveCommonProtoPath('permission_service/policy_instance_preview.proto'),
  resolveCommonProtoPath('permission_service/permission_terminal_access.proto')
]

/** siteGrpcLoaderOptions preserves SITE uint64 strings and proto3 repeated-field defaults. */
const siteGrpcLoaderOptions = { longs: String, arrays: true }

@Module({
  imports: [
    RegistryModule,
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule.forRoot({ serviceName: 'api-gateway' }),
    CommonJwtModule,

    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.ASSET]: {
          serviceName: SERVICE_NAMES.ASSET,
          protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
          packageName: 'asset_service',
          url:
            process.env.ASSET_SERVICE_HOST && process.env.ASSET_SERVICE_PORT
              ? `${process.env.ASSET_SERVICE_HOST}:${process.env.ASSET_SERVICE_PORT}`
              : 'localhost:50056'
        },
        [SERVICE_NAMES.FINANCE]: {
          serviceName: SERVICE_NAMES.FINANCE,
          protoPath: resolveCommonProtoPath('finance_service/finance.proto'),
          packageName: 'finance_service',
          url:
            process.env.FINANCE_SERVICE_HOST && process.env.FINANCE_SERVICE_PORT
              ? `${process.env.FINANCE_SERVICE_HOST}:${process.env.FINANCE_SERVICE_PORT}`
              : 'localhost:50063'
        },
        [SERVICE_NAMES.SITE]: {
          serviceName: SERVICE_NAMES.SITE,
          protoPath: resolveCommonProtoPath('site_service/site.proto'),
          packageName: 'site_service',
          loader: siteGrpcLoaderOptions,
          url: resolveSiteGrpcUrl()
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: permissionGrpcProtoPaths,
          packageName: 'permission_service',
          loader: {
            includeDirs: [resolveCommonContractPath(), resolveCommonContractPath('permission_service')]
          },
          url:
            process.env.PERMISSION_SERVICE_HOST && process.env.PERMISSION_SERVICE_PORT
              ? `${process.env.PERMISSION_SERVICE_HOST}:${process.env.PERMISSION_SERVICE_PORT}`
              : 'permission-service:50051'
        },
        [SERVICE_NAMES.TERMINAL_DEVICE]: {
          serviceName: SERVICE_NAMES.TERMINAL_DEVICE,
          protoPath: resolveCommonProtoPath('terminal_device_service/terminal_device.proto'),
          packageName: 'terminal_device_service',
          url: resolveTerminalDeviceGrpcUrl()
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),

    GrpcTransportModule.forFeature([SERVICE_NAMES.PERMISSION]),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '200', 10)
        }
      ]
    }),

    HealthModule,
    GatewayTrustedGrpcExecutionModule,
    GatewayFoundationTrustedGrpcModule,
    ExternalApiModule,
    AuthBffModule,
    BrowserActivityBffModule,
    PdaBffModule,
    TerminalDeviceAdminBffModule,
    CollaborationServiceProxyModule,
    CrmServiceProxyModule,
    FinanceServiceProxyModule,
    HrServiceProxyModule,
    ItemMasterServiceProxyModule,
    MesServiceProxyModule,
    PermissionServiceProxyModule,
    ProcurementServiceProxyModule,
    PublicEntryServiceProxyModule,
    SalesServiceProxyModule,
    SiteManagementBffModule,
    SiteRuntimeBffModule,
    SrmServiceProxyModule,
    TenantOrgServiceProxyModule,
    WmsServiceProxyModule
  ],
  providers: [
    ...createGatewaySourceCredentialProviders(),
    GatewayPermissionTrustedMetadata,
    {
      provide: GATEWAY_PERMISSION_TRUSTED_METADATA_PROVIDER,
      useExisting: GatewayPermissionTrustedMetadata
    },
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ...createGatewayGuardProviders(),

    GatewayExceptionFilter,
    ResponseTransformInterceptor,
    TimeoutInterceptor
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*')
  }
}
