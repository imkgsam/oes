import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityQueryGrpcAdapter } from '../auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { PermissionAccessSummaryGrpcAdapter } from '../auth-bff/infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter'
import { AdminCrmPerformanceService } from './admin-crm-performance.service'
import { CustomerManagementGrpcAdapter } from './adapters/customer-management-grpc.adapter'
import { CustomerQueryGrpcAdapter } from './adapters/customer-query-grpc.adapter'
import { CustomerManagementController } from './interface/http/controllers/customer-management.controller'
import { AdminCrmPerformanceController } from './interface/http/controllers/admin-crm-performance.controller'
import { ExtensionCrmWorkspaceController } from './interface/http/controllers/extension-crm-workspace.controller'
import { CustomerManagementService } from './customer-management.service'
import { ExtensionCrmWorkspaceService } from './extension-crm-workspace.service'

@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.CRM])],
  controllers: [
    CustomerManagementController,
    ExtensionCrmWorkspaceController,
    AdminCrmPerformanceController
  ],
  providers: [
    AdminCrmPerformanceService,
    CustomerQueryGrpcAdapter,
    CustomerManagementGrpcAdapter,
    IdentityQueryGrpcAdapter,
    PermissionAccessSummaryGrpcAdapter,
    CustomerManagementService,
    ExtensionCrmWorkspaceService
  ]
})
// CrmServiceProxyModule wires the thin tenant customer-management BFF proxy into api-gateway.
export class CrmServiceProxyModule {}
