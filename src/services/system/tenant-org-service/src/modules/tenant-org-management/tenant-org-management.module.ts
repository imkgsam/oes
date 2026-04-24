import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { ORGANIZATION_PARTY_READER } from '../../application/ports/organization-party-reader.port'
import { ORG_UNIT_REPOSITORY, TENANT_REPOSITORY } from '../../domain/repositories'
import { TenantOrgManagementService } from '../../application/services'
import { PartyQueryGrpcAdapter } from '../../infrastructure/adapters/party-query.grpc.adapter'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaOrgUnitRepository } from '../../infrastructure/repositories/prisma-org-unit.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma-tenant.repository'
import { TenantOrgManagementGrpcController } from '../../interfaces/grpc/tenant-org-management.grpc.controller'

/** TenantOrgManagementModule wires tenant/org write-side gRPC controllers to repositories. */
@Module({
  imports: [PrismaModule, AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PARTY])],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository
    },
    {
      provide: ORG_UNIT_REPOSITORY,
      useClass: PrismaOrgUnitRepository
    },
    {
      provide: ORGANIZATION_PARTY_READER,
      useClass: PartyQueryGrpcAdapter
    },
    PartyQueryGrpcAdapter,
    TenantOrgManagementService
  ],
  controllers: [TenantOrgManagementGrpcController]
})
export class TenantOrgManagementModule {}
