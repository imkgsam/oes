import { Module } from '@nestjs/common'
import {
  PARTY_IDENTIFIER_REPOSITORY,
  PARTY_REGISTRATION_IDEMPOTENCY_REPOSITORY,
  PARTY_REPOSITORY,
  TENANT_PARTY_REPOSITORY
} from '../../domain/repositories'
import { PartyRegistrationService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPartyRepository } from '../../infrastructure/repositories/prisma-party.repository'
import { PrismaPartyIdentifierRepository } from '../../infrastructure/repositories/prisma-party-identifier.repository'
import { PrismaPartyRegistrationIdempotencyRepository } from '../../infrastructure/repositories/prisma-party-registration-idempotency.repository'
import { PrismaTenantPartyRepository } from '../../infrastructure/repositories/prisma-tenant-party.repository'
import { PartyRegistrationGrpcController } from '../../interfaces/grpc/party-registration.grpc.controller'

/** PartyRegistrationModule wires write-side registration and tenant binding behavior. */
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
    {
      provide: PARTY_IDENTIFIER_REPOSITORY,
      useClass: PrismaPartyIdentifierRepository
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
