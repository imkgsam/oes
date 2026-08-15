import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { IdentityTenantAccountStatsGrpcAdapter } from './adapters/identity-tenant-account-stats-grpc.adapter'
import { IdentityUserLookupGrpcAdapter } from './adapters/identity-user-lookup-grpc.adapter'
import { PartyQueryGrpcAdapter } from './adapters/party-query-grpc.adapter'
import { TenantOrgManagementGrpcAdapter } from './adapters/tenant-org-management-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from './adapters/tenant-org-query-grpc.adapter'
import { OrgManagementController } from './interface/http/controllers/org-management.controller'
import { TenantManagementController } from './interface/http/controllers/tenant-management.controller'
import { OrgManagementService } from './org-management.service'
import { TenantManagementService } from './tenant-management.service'

@Module({
  imports: [
    AuthorizationModule
  ],
  controllers: [TenantManagementController, OrgManagementController],
  providers: [
    IdentityTenantAccountStatsGrpcAdapter,
    IdentityUserLookupGrpcAdapter,
    PartyQueryGrpcAdapter,
    TenantOrgQueryGrpcAdapter,
    TenantOrgManagementGrpcAdapter,
    TenantManagementService,
    OrgManagementService
  ],
  exports: [OrgManagementService]
})
export class TenantOrgServiceProxyModule {}
