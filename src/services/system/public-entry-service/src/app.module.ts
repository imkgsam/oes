import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { ShortLinkModule } from './modules/short-link/short-link.module'
import { BusinessCardModule } from './modules/business-card/business-card.module'
import { PublicEntryTrustedExecutionModule } from './modules/public-entry-trusted-execution.module'

// AppModule wires public-entry-service modules and service-scoped infrastructure.
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'public-entry-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    ShortLinkModule,
    BusinessCardModule
    , PublicEntryTrustedExecutionModule
  ]
})
export class AppModule {}
