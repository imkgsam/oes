import { Module } from '@nestjs/common'
import { PARTY_REPOSITORY } from '../../domain/repositories'
import { PartyMergeService } from '../../application/services'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPartyRepository } from '../../infrastructure/repositories/prisma-party.repository'
import { PartyMergeGrpcController } from '../../interfaces/grpc/party-merge.grpc.controller'

/** PartyMergeModule wires the guarded merge flow for duplicate canonical parties. */
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PARTY_REPOSITORY,
      useClass: PrismaPartyRepository
    },
    PartyMergeService
  ],
  controllers: [PartyMergeGrpcController]
})
export class PartyMergeModule {}
