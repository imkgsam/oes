import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { SiteAdminGrpcAdapter } from './infrastructure/downstream/site-admin-grpc.adapter'
import { SiteManagementController } from './interface/http/controllers/site-management.controller'
import { SITE_MANAGEMENT_DOWNSTREAM, SiteManagementService } from './site-management.service'

/** SiteManagementBffModule wires tenant-web Site Management routes to site-service. */
@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.SITE])],
  controllers: [SiteManagementController],
  providers: [
    SiteAdminGrpcAdapter,
    { provide: SITE_MANAGEMENT_DOWNSTREAM, useExisting: SiteAdminGrpcAdapter },
    SiteManagementService
  ]
})
export class SiteManagementBffModule {}
