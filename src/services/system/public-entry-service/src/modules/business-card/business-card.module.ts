import { Injectable, Module, OnModuleInit } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule, GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'
import { BusinessCardApplicationService } from '../../application/services/business-card-application.service'
import { PublicEntryBusinessCardGrpcController } from '../../interfaces/grpc/public-entry-business-card.grpc.controller'
import { ShortLinkApplicationService } from '../../application/services/short-link-application.service'
import { ShortLinkTargetResolverRegistry } from '../../application/services/short-link-target-resolver.registry'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaBusinessCardRepository } from '../../infrastructure/repositories/prisma-business-card.repository'
import {
  BusinessCardContactAssetGrpcAdapter,
  BusinessCardEmployeeGrpcAdapter,
  BusinessCardTenantProfileGrpcAdapter,
  PUBLIC_ENTRY_HR_GRPC_CLIENT,
  PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT,
  PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT
} from '../../infrastructure/adapters/business-card-upstream.grpc.adapters'
import {
  PermissionBusinessCardAuthorizationAdapter,
  PUBLIC_ENTRY_PERMISSION_GRPC_CLIENT
} from '../../infrastructure/adapters/permission-business-card-authorization.adapter'
import { ShortLinkModule } from '../short-link/short-link.module'

// buildBusinessCardGrpcClients declares downstream clients consumed by BusinessCard application adapters.
export function buildBusinessCardGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: PUBLIC_ENTRY_PERMISSION_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'permission_service',
        protoPath: [resolveCommonProtoPath('permission_service/permission_check.proto')],
        url:
          process.env.GRPC_SERVICE_PERMISSION_URL?.trim() ||
          process.env.PERMISSION_GRPC_URL?.trim() ||
          ((process.env.NODE_ENV ?? 'development') !== 'production' ? '127.0.0.1:50051' : undefined)
      }
    },
    {
      name: PUBLIC_ENTRY_HR_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'hr_service',
        protoPath: [resolveCommonProtoPath('hr_service/hr.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_HR_URL', 'HR_GRPC_URL', '127.0.0.1:50055')
      }
    },
    {
      name: PUBLIC_ENTRY_IDENTITY_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'identity_service',
        protoPath: [resolveCommonProtoPath('identity_service/identity_query.proto')],
        url: resolveDownstreamGrpcUrl(
          'GRPC_SERVICE_IDENTITY_URL',
          'IDENTITY_GRPC_URL',
          '127.0.0.1:50052'
        )
      }
    },
    {
      name: PUBLIC_ENTRY_TENANT_ORG_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'tenant_org_service',
        protoPath: [resolveCommonProtoPath('tenant_org_service/tenant_org.proto')],
        url: resolveDownstreamGrpcUrl(
          'GRPC_SERVICE_TENANT_ORG_URL',
          'TENANT_ORG_GRPC_URL',
          '127.0.0.1:50054'
        )
      }
    }
  ]
}

/** Adds mandatory workload credentials and rejects an unresolved Public Entry downstream URL. */
function createMtlsClientProvider(client: ClientProviderOptions): ClientProviderOptions {
  if (
    !('transport' in client) ||
    client.transport !== Transport.GRPC ||
    !('options' in client) ||
    !('url' in client.options) ||
    !client.options.url
  ) {
    throw new Error('PUBLIC_ENTRY_FOUNDATION_EXECUTION_UNAVAILABLE')
  }
  return {
    ...client,
    options: { ...client.options, credentials: createGrpcClientCredentials() }
  } as ClientProviderOptions
}

// BusinessCardResolverRegistration registers the BUSINESS_CARD target resolver with the ShortLink module registry.
@Injectable()
export class BusinessCardResolverRegistration implements OnModuleInit {
  constructor(
    private readonly registry: ShortLinkTargetResolverRegistry,
    private readonly service: BusinessCardApplicationService
  ) {}

  onModuleInit(): void {
    this.registry.register('BUSINESS_CARD', this.service)
  }
}

// BusinessCardModule assembles Phase 1 BusinessCard application services and resolver integration.
@Module({
  imports: [
    AuthorizationModule,
    PrismaModule,
    ShortLinkModule,
    ClientsModule.registerAsync(
      buildBusinessCardGrpcClients().map((client) => ({
        name: client.name,
        useFactory: () => createMtlsClientProvider(client)
      }))
    )
  ],
  controllers: [PublicEntryBusinessCardGrpcController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: GrpcRequestContextInterceptor },
    PrismaBusinessCardRepository,
    BusinessCardEmployeeGrpcAdapter,
    BusinessCardContactAssetGrpcAdapter,
    BusinessCardTenantProfileGrpcAdapter,
    PermissionBusinessCardAuthorizationAdapter,
    {
      provide: BusinessCardApplicationService,
      useFactory: (
        repository: PrismaBusinessCardRepository,
        shortLinkService: ShortLinkApplicationService,
        employeePort: BusinessCardEmployeeGrpcAdapter,
        contactAssetPort: BusinessCardContactAssetGrpcAdapter,
        tenantProfilePort: BusinessCardTenantProfileGrpcAdapter,
        authorizationPort: PermissionBusinessCardAuthorizationAdapter
      ) =>
        new BusinessCardApplicationService(
          repository,
          shortLinkService,
          employeePort,
          contactAssetPort,
          tenantProfilePort,
          authorizationPort
        ),
      inject: [
        PrismaBusinessCardRepository,
        ShortLinkApplicationService,
        BusinessCardEmployeeGrpcAdapter,
        BusinessCardContactAssetGrpcAdapter,
        BusinessCardTenantProfileGrpcAdapter,
        PermissionBusinessCardAuthorizationAdapter
      ]
    },
    BusinessCardResolverRegistration
  ],
  exports: [BusinessCardApplicationService]
})
export class BusinessCardModule {}

// resolveDownstreamGrpcUrl keeps standard env overrides while providing local development defaults.
function resolveDownstreamGrpcUrl(
  primaryEnv: string,
  legacyEnv: string,
  defaultUrl: string
): string | undefined {
  return (
    process.env[primaryEnv]?.trim() ||
    process.env[legacyEnv]?.trim() ||
    ((process.env.NODE_ENV ?? 'development') !== 'production' ? defaultUrl : undefined)
  )
}
