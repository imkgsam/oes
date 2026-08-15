import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { TenantOrgManagementModule } from './modules/tenant-org-management/tenant-org-management.module'
import { TenantOrgQueryModule } from './modules/tenant-org-query/tenant-org-query.module'
import { TenantOrgTrustedExecutionModule } from './modules/tenant-org-trusted-execution.module'

/** AppModule wires tenant-org-service modules and enables service-scoped logging metadata. */
@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'tenant-org-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    AuthorizationModule,
    PrismaModule,
    TenantOrgTrustedExecutionModule,
    TenantOrgQueryModule,
    TenantOrgManagementModule
  ]
})
export class AppModule {}
