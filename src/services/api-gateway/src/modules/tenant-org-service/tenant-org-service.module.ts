import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { AuthorizationModule } from '@oes/common/authorization'
import { GrpcTransportModule } from '@oes/common/transport'
import { PartyQueryGrpcAdapter } from './adapters/party-query-grpc.adapter'
import { TenantOrgManagementGrpcAdapter } from './adapters/tenant-org-management-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './adapters/tenant-org-query-grpc.adapter'
import { OrgManagementController } from './interface/http/controllers/org-management.controller'
import { TenantManagementController } from './interface/http/controllers/tenant-management.controller'
import { OrgManagementService } from './org-management.service'
import { TenantManagementService } from './tenant-management.service'

@Module({
  imports: [
    AuthorizationModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.PARTY, SERVICE_NAMES.TENANT_ORG])
  ],
  controllers: [TenantManagementController, OrgManagementController],
  providers: [
    PartyQueryGrpcAdapter,
    TenantOrgQueryGrpcAdapter,
    TenantOrgManagementGrpcAdapter,
    TenantManagementService,
    OrgManagementService
  ],
  exports: [OrgManagementService]
})
export class TenantOrgServiceProxyModule {}
