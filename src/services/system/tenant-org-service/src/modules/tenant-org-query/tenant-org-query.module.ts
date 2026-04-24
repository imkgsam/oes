import { Module } from '@nestjs/common'
import { ORG_UNIT_REPOSITORY, TENANT_REPOSITORY } from '../../domain/repositories'
import { TenantOrgQueryService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaOrgUnitRepository } from '../../infrastructure/repositories/prisma-org-unit.repository'
import { PrismaTenantRepository } from '../../infrastructure/repositories/prisma-tenant.repository'
import { TenantOrgQueryGrpcController } from '../../interfaces/grpc/tenant-org-query.grpc.controller'

/** TenantOrgQueryModule wires tenant/org read-side gRPC controllers to repositories. */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository
    },
    {
      provide: ORG_UNIT_REPOSITORY,
      useClass: PrismaOrgUnitRepository
    },
    TenantOrgQueryService
  ],
  controllers: [TenantOrgQueryGrpcController]
})
export class TenantOrgQueryModule {}
