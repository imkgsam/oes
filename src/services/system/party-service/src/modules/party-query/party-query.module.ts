import { Module } from '@nestjs/common'
import { PARTY_REPOSITORY, TENANT_PARTY_REPOSITORY } from '../../domain/repositories'
import { PartyQueryService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPartyRepository } from '../../infrastructure/repositories/prisma-party.repository'
import { PrismaTenantPartyRepository } from '../../infrastructure/repositories/prisma-tenant-party.repository'
import { PartyQueryGrpcController } from '../../interfaces/grpc/party-query.grpc.controller'

/** PartyQueryModule wires read-side canonical and tenant-scoped party lookup behavior. */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PARTY_REPOSITORY,
      useClass: PrismaPartyRepository
    },
    {
      provide: TENANT_PARTY_REPOSITORY,
      useClass: PrismaTenantPartyRepository
    },
    PartyQueryService
  ],
  controllers: [PartyQueryGrpcController]
})
export class PartyQueryModule {}
