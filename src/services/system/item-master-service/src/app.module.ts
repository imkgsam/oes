import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthorizationModule } from '@oes/common/authorization'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ItemMasterManagementModule } from './modules/item-master-management/item-master-management.module'
import { ItemMasterQueryModule } from './modules/item-master-query/item-master-query.module'
import { ItemMasterTrustedExecutionModule } from './modules/item-master-trusted-execution.module'

/** AppModule wires item-master-service modules and service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'item-master-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    RegistryModule,
    PrismaModule,
    ItemMasterTrustedExecutionModule,
    ItemMasterQueryModule,
    ItemMasterManagementModule
  ]
})
export class AppModule {}
