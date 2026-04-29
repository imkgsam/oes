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
import { CrmServiceProxyModule } from './modules/crm-service/crm-service.module'
import { FinanceServiceProxyModule } from './modules/finance-service/finance-service.module'
import { HrServiceProxyModule } from './modules/hr-service/hr-service.module'
import { ItemMasterServiceProxyModule } from './modules/item-master-service/item-master-service.module'
import { PermissionServiceProxyModule } from './modules/permission-service/permission-service.module'
import { ProcurementServiceProxyModule } from './modules/procurement-service/procurement-service.module'
import { SalesServiceProxyModule } from './modules/sales-service/sales-service.module'
import { SrmServiceProxyModule } from './modules/srm-service/srm-service.module'
import { TenantOrgServiceProxyModule } from './modules/tenant-org-service/tenant-org-service.module'
import { GatewayExceptionFilter } from './common/filters/gateway-exception.filter'
import { ResponseTransformInterceptor } from './common/interceptors/response.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'

/** resolveTenantOrgGrpcUrl avoids localhost IPv6 ambiguity for the local tenant-org fallback endpoint. */
export function resolveTenantOrgGrpcUrl() {
  return process.env.TENANT_ORG_SERVICE_HOST && process.env.TENANT_ORG_SERVICE_PORT
    ? `${process.env.TENANT_ORG_SERVICE_HOST}:${process.env.TENANT_ORG_SERVICE_PORT}`
    : '127.0.0.1:50054'
}

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
          url:
            process.env.AUTH_SERVICE_HOST && process.env.AUTH_SERVICE_PORT
              ? `${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}`
              : undefined
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
          protoPath: [
            resolveCommonProtoPath('permission_service/policy_management.proto'),
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
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
          url:
            process.env.HR_SERVICE_HOST && process.env.HR_SERVICE_PORT
              ? `${process.env.HR_SERVICE_HOST}:${process.env.HR_SERVICE_PORT}`
              : 'localhost:50055'
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
    CrmServiceProxyModule,
    FinanceServiceProxyModule,
    HrServiceProxyModule,
    ItemMasterServiceProxyModule,
    PermissionServiceProxyModule,
    ProcurementServiceProxyModule,
    SalesServiceProxyModule,
    SrmServiceProxyModule,
    TenantOrgServiceProxyModule
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
