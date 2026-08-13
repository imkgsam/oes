import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AuthorizationModule } from '@oes/common/authorization'
import { NacosConfigModule } from '@oes/common/config'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import {
  OPERATOR_PERMISSION_RESOLVER,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityAuditModule } from './modules/identity-audit/identity-audit.module'
import { IdentityMachineAuthModule } from './modules/identity-machine-auth/identity-machine-auth.module'
import { IdentityManagementModule } from './modules/identity-management/identity-management.module'
import { IdentityQueryModule } from './modules/identity-query/identity-query.module'

function resolveGrpcUrl(envKey: string, fallbackUrl: string): string | undefined {
  const explicitUrl = process.env[envKey]
  if (explicitUrl) {
    return explicitUrl
  }

  if (process.env.NODE_ENV !== 'production') {
    return fallbackUrl
  }

  return undefined
}

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    LoggingModule.forRoot({ serviceName: 'identity-service' }),
    RegistryModule,
    NacosConfigModule,
    EventEmitterModule.forRoot(),
    GrpcTransportModule.forRoot({
      services: {
        [SERVICE_NAMES.PERMISSION]: {
          serviceName: SERVICE_NAMES.PERMISSION,
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto')
          ],
          packageName: 'permission_service',
          url: resolveGrpcUrl('GRPC_SERVICE_PERMISSION_URL', '127.0.0.1:50051')
        },
        [SERVICE_NAMES.TENANT_ORG]: {
          serviceName: SERVICE_NAMES.TENANT_ORG,
          protoPath: resolveCommonProtoPath('tenant_org_service/tenant_org.proto'),
          packageName: 'tenant_org_service',
          url: resolveGrpcUrl('TENANT_ORG_GRPC_URL', '127.0.0.1:50054')
        }
      }
    }),
    GrpcTransportModule.forFeature([
      SERVICE_NAMES.PERMISSION,
      SERVICE_NAMES.TENANT_ORG
    ]),
    AuthorizationModule,
    IdentityAuditModule,
    IdentityMachineAuthModule,
    IdentityManagementModule,
    IdentityQueryModule
  ],
  providers: [
    PermissionServicePermissionReadAdaptor,
    RoleBasedOperatorPermissionResolver,
    {
      provide: OPERATOR_PERMISSION_RESOLVER,
      useExisting: RoleBasedOperatorPermissionResolver
    }
  ]
})
/**
 * AppModule wires identity-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
