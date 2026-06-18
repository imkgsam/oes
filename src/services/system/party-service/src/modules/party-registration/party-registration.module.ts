import { Module } from '@nestjs/common'
import {
  PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY,
  TENANT_PARTY_REPOSITORY
} from '../../domain/repositories'
import { PartyRegistrationService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPartyRegistrationIdempotencyRepository } from '../../infrastructure/repositories/prisma-party-registration-idempotency.repository'
import { PrismaTenantPartyRepository } from '../../infrastructure/repositories/prisma-tenant-party.repository'
import { PartyRegistrationGrpcController } from '../../interfaces/grpc/party-registration.grpc.controller'

/** PartyRegistrationModule wires tenant-scoped TenantParty registration behavior. */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: TENANT_PARTY_REPOSITORY,
      useClass: PrismaTenantPartyRepository
    },
    {
      provide: PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY,
      useClass: PrismaPartyRegistrationIdempotencyRepository
    },
    PartyRegistrationService
  ],
  controllers: [PartyRegistrationGrpcController]
})
export class PartyRegistrationModule {}
