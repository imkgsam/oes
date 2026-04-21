import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { PartyQueryModule } from './modules/party-query/party-query.module'
import { PartyRegistrationModule } from './modules/party-registration/party-registration.module'
import { PartyMergeModule } from './modules/party-merge/party-merge.module'

/** AppModule wires party-service modules and enables service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'party-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    PrismaModule,
    PartyQueryModule,
    PartyRegistrationModule,
    PartyMergeModule
  ]
})
export class AppModule {}
