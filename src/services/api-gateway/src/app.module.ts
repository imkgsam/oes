import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { CommonJwtModule } from '@oes/common/auth'
import { GatewayPermissionGuard } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { gatewayConfig } from './config/gateway.config'
import { HealthModule } from './health/health.module'
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware'
import { GatewaySessionAuthGuard } from './common/guards/gateway-session-auth.guard'
import { AuthBffModule } from './modules/auth-bff/auth-bff.module'
import { PdaBffModule } from './modules/pda-bff/pda-bff.module'
import { TerminalDeviceAdminBffModule } from './modules/terminal-device-admin-bff/terminal-device-admin-bff.module'
import { CrmServiceProxyModule } from './modules/crm-service/crm-service.module'
import { FinanceServiceProxyModule } from './modules/finance-service/finance-service.module'
import { HrServiceProxyModule } from './modules/hr-service/hr-service.module'
import { ItemMasterServiceProxyModule } from './modules/item-master-service/item-master-service.module'
import { MesServiceProxyModule } from './modules/mes-service/mes-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { ProcurementServiceProxyModule } from './modules/procurement-service/procurement-service.module'
import { PublicEntryServiceProxyModule } from './modules/public-entry-service/public-entry-service.module'
import { SalesServiceProxyModule } from './modules/sales-service/sales-service.module'
import { SrmServiceProxyModule } from './modules/srm-service/srm-service.module'
import { TenantOrgServiceProxyModule } from './modules/tenant-org-service/tenant-org-service.module'
import { WmsServiceProxyModule } from './modules/wms-service/wms-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'

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

/** resolveMesGrpcUrl centralizes the local MES fallback endpoint used by api-gateway. */
export function resolveMesGrpcUrl() {
  return process.env.MES_SERVICE_HOST && process.env.MES_SERVICE_PORT
    ? `${process.env.MES_SERVICE_HOST}:${process.env.MES_SERVICE_PORT}`
    : 'localhost:50065'
}

/** resolvePublicEntryGrpcUrl centralizes the local public-entry-service fallback endpoint used by api-gateway. */
export function resolvePublicEntryGrpcUrl() {
  return process.env.PUBLIC_ENTRY_SERVICE_HOST && process.env.PUBLIC_ENTRY_SERVICE_PORT
    ? `${process.env.PUBLIC_ENTRY_SERVICE_HOST}:${process.env.PUBLIC_ENTRY_SERVICE_PORT}`
    : 'localhost:50067'
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
  resolveCommonProtoPath('permission_service/permission_terminal_access.proto')
]

@Module({
  imports: [
    RegistryModule,
    ConfigModule.forRoot({ isGlobal: true, load: [gatewayConfig] }),
    LoggingModule.forRoot({ serviceName: 'api-gateway' }),
    CommonJwtModule,

    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.AUTH]: {
          serviceName: SERVICE_NAMES.AUTH,
          protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
          packageName: 'auth_service',
          url: resolveAuthGrpcUrl()
        },
        [SERVICE_NAMES.ASSET]: {
          serviceName: SERVICE_NAMES.ASSET,
          protoPath: resolveCommonProtoPath('asset_service/asset.proto'),
          packageName: 'asset_service',
          url:
            process.env.ASSET_SERVICE_HOST && process.env.ASSET_SERVICE_PORT
              ? `${process.env.ASSET_SERVICE_HOST}:${process.env.ASSET_SERVICE_PORT}`
              : 'localhost:50056'
        },
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: permissionGrpcProtoPaths,
          packageName: 'permission_service',
          url:
            process.env.PERMISSION_SERVICE_HOST && process.env.PERMISSION_SERVICE_PORT
              ? `${process.env.PERMISSION_SERVICE_HOST}:${process.env.PERMISSION_SERVICE_PORT}`
              : undefined
        },
        [SERVICE_NAMES.HR]: {
          serviceName: SERVICE_NAMES.HR,
          protoPath: resolveCommonProtoPath('hr_service/hr.proto'),
          packageName: 'hr_service',
          url: resolveHrGrpcUrl()
        },
        [SERVICE_NAMES.CRM]: {
          serviceName: SERVICE_NAMES.CRM,
          protoPath: resolveCommonProtoPath('crm_service/crm.proto'),
          packageName: 'crm_service',
          url:
            process.env.CRM_SERVICE_HOST && process.env.CRM_SERVICE_PORT
              ? `${process.env.CRM_SERVICE_HOST}:${process.env.CRM_SERVICE_PORT}`
              : 'localhost:50060'
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
        [SERVICE_NAMES.IDENTITY]: {
          serviceName: SERVICE_NAMES.IDENTITY,
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          packageName: 'identity_service',
          url:
            process.env.IDENTITY_SERVICE_HOST && process.env.IDENTITY_SERVICE_PORT
              ? `${process.env.IDENTITY_SERVICE_HOST}:${process.env.IDENTITY_SERVICE_PORT}`
              : 'localhost:50052'
        },
        [SERVICE_NAMES.ITEM_MASTER]: {
          serviceName: SERVICE_NAMES.ITEM_MASTER,
          protoPath: resolveCommonProtoPath('item_master_service/item_master.proto'),
          packageName: 'item_master_service',
          url:
            process.env.ITEM_MASTER_SERVICE_HOST && process.env.ITEM_MASTER_SERVICE_PORT
              ? `${process.env.ITEM_MASTER_SERVICE_HOST}:${process.env.ITEM_MASTER_SERVICE_PORT}`
              : 'localhost:50058'
        },
        [SERVICE_NAMES.MES]: {
          serviceName: SERVICE_NAMES.MES,
          protoPath: resolveCommonProtoPath('mes_service/mes.proto'),
          packageName: 'mes_service',
          url: resolveMesGrpcUrl()
        },
        [SERVICE_NAMES.PARTY]: {
          serviceName: SERVICE_NAMES.PARTY,
          protoPath: resolveCommonProtoPath('party_service/party.proto'),
          packageName: 'party_service',
          url:
            process.env.PARTY_SERVICE_HOST && process.env.PARTY_SERVICE_PORT
              ? `${process.env.PARTY_SERVICE_HOST}:${process.env.PARTY_SERVICE_PORT}`
              : 'localhost:50053'
        },
        [SERVICE_NAMES.PROCUREMENT]: {
          serviceName: SERVICE_NAMES.PROCUREMENT,
          protoPath: resolveCommonProtoPath('procurement_service/procurement.proto'),
          packageName: 'procurement_service',
          url:
            process.env.PROCUREMENT_SERVICE_HOST && process.env.PROCUREMENT_SERVICE_PORT
              ? `${process.env.PROCUREMENT_SERVICE_HOST}:${process.env.PROCUREMENT_SERVICE_PORT}`
              : 'localhost:50062'
        },
        [SERVICE_NAMES.PUBLIC_ENTRY]: {
          serviceName: SERVICE_NAMES.PUBLIC_ENTRY,
          protoPath: resolveCommonProtoPath('public_entry_service/public_entry.proto'),
          packageName: 'public_entry_service',
          url: resolvePublicEntryGrpcUrl()
        },
        [SERVICE_NAMES.SRM]: {
          serviceName: SERVICE_NAMES.SRM,
          protoPath: resolveCommonProtoPath('srm_service/srm.proto'),
          packageName: 'srm_service',
          url:
            process.env.SRM_SERVICE_HOST && process.env.SRM_SERVICE_PORT
              ? `${process.env.SRM_SERVICE_HOST}:${process.env.SRM_SERVICE_PORT}`
              : 'localhost:50061'
        },
        [SERVICE_NAMES.TENANT_ORG]: {
          serviceName: SERVICE_NAMES.TENANT_ORG,
          protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
          packageName: 'tenant_org_service',
          url: resolveTenantOrgGrpcUrl()
        },
        [SERVICE_NAMES.TERMINAL_DEVICE]: {
          serviceName: SERVICE_NAMES.TERMINAL_DEVICE,
          protoPath: resolveCommonProtoPath('terminal_device_service/terminal_device.proto'),
          packageName: 'terminal_device_service',
          url: resolveTerminalDeviceGrpcUrl()
        },
        [SERVICE_NAMES.WMS]: {
          serviceName: SERVICE_NAMES.WMS,
          protoPath: resolveCommonProtoPath('wms_service/wms.proto'),
          packageName: 'wms_service',
          url:
            process.env.WMS_SERVICE_HOST && process.env.WMS_SERVICE_PORT
              ? `${process.env.WMS_SERVICE_HOST}:${process.env.WMS_SERVICE_PORT}`
              : 'localhost:50064'
        },
        'sales-service': {
          serviceName: 'sales-service',
          protoPath: resolveCommonProtoPath('sales_service/sales.proto'),
          packageName: 'sales_service',
          url:
            process.env.SALES_SERVICE_HOST && process.env.SALES_SERVICE_PORT
              ? `${process.env.SALES_SERVICE_HOST}:${process.env.SALES_SERVICE_PORT}`
              : 'localhost:50059'
        }
      },
      defaultPoolConfig: { minSize: 3, maxSize: 3 }
    }),
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.PARTY,
      SERVICE_NAMES.TENANT_ORG
    ]),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10)
        }
      ]
    }),

    HealthModule,
    AuthBffModule,
    PdaBffModule,
    TerminalDeviceAdminBffModule,
    CrmServiceProxyModule,
    FinanceServiceProxyModule,
    HrServiceProxyModule,
    ItemMasterServiceProxyModule,
    MesServiceProxyModule,
    PermissionServiceProxyModule,
    ProcurementServiceProxyModule,
    PublicEntryServiceProxyModule,
    SalesServiceProxyModule,
    SrmServiceProxyModule,
    TenantOrgServiceProxyModule,
    WmsServiceProxyModule
  ],
  providers: [
    GatewayPermissionGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: GatewaySessionAuthGuard },
    { provide: APP_GUARD, useExisting: GatewayPermissionGuard },

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
