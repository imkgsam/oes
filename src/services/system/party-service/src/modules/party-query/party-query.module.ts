import { Module } from '@nestjs/common'
import { TENANT_PARTY_REPOSITORY } from '../../domain/repositories'
import { PartyQueryService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaTenantPartyRepository } from '../../infrastructure/repositories/prisma-tenant-party.repository'
import { PartyQueryGrpcController } from '../../interfaces/grpc/party-query.grpc.controller'

/** PartyQueryModule wires read-side tenant-scoped TenantParty lookup behavior. */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: TENANT_PARTY_REPOSITORY,
      useClass: PrismaTenantPartyRepository
    },
    PartyQueryService
  ],
  controllers: [PartyQueryGrpcController]
})
export class PartyQueryModule {}
