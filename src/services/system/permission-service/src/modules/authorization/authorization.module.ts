import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import { PERMISSION_DECISION_AUDIT_PORT } from '../../application/ports/permission-decision-audit.port'
import { PermissionDecisionPolicy } from '../../domain/services/permission-decision-policy'
import { PrismaPrincipalAuthorizationRepository } from '../../infrastructure/repositories/prisma/prisma.principal-authorization.repository'
import { EnvironmentWorkloadIssuancePolicyRepository } from '../../infrastructure/repositories/config/environment-workload-issuance-policy.repository'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import {
  PERMISSION_SERVICE_AUDIENCE,
  PERMISSION_AUTH_SERVICE_SPIFFE_ID,
  PERMISSION_DECISION_TARGET_AUDIENCE,
  PermissionDecisionTransportGuard,
  PermissionTrustedInternalExecutionGuard
} from '../../interfaces/guards'
import { PermissionModule } from '../permission/permission.module'
import { RoleModule } from '../role/role.module'
import { PolicyModule } from '../policy/policy.module'
import { AccessSummaryQueryHandlers } from '../../application/queries/access-summary'
import { AuthorizationQueryHandlers } from '../../application/queries/authorization'
import { TerminalAccessRuntimeQueryHandlers } from '../../application/queries/terminal-access'
import { SYMBOLS } from '../../common/constants/symbols'
import {
  ACCOUNT_AUTHORIZATION_SERVICE,
  AccountAuthorizationService
} from '../../domain/services/account-authorization.service'
import { NavigationResolverService } from '../../domain/services/navigation-resolver.service'
import { TerminalAccessResolverService } from '../../domain/services/terminal-access-resolver.service'
import {
  PolicyTemplateInstanceAuthorizationService,
  PolicyTemplateInstanceReader
} from '../../application/authorization/resource-policy'
import { ResourceAuthorizationService } from '../../application/authorization/resource-authorization.service'
import { PolicyInstancePreviewService } from '../../application/authorization/policy-instance-preview.service'
import { PermissionAccessSummaryGrpcController } from '../../interfaces/grpc/permission-access-summary.grpc.controller'
import { PermissionCheckGrpcController } from '../../interfaces/grpc/permission-check.grpc.controller'
import { PolicyInstancePreviewGrpcController } from '../../interfaces/grpc/policy-instance-preview.grpc.controller'
import { ResourceAuthorizationGrpcController } from '../../interfaces/grpc/resource-authorization.grpc.controller'
import { PermissionTerminalAccessGrpcController } from '../../interfaces/grpc/permission-terminal-access.grpc.controller'
import { PermissionAuditModule } from '../audit/permission-audit.module'
import { ManagementAuthorizationModule } from '../management-authorization/management-authorization.module'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    PermissionModule,
    RoleModule,
    PolicyModule,
    PermissionAuditModule,
    ManagementAuthorizationModule
  ],
  providers: [
    NavigationResolverService,
    TerminalAccessResolverService,
    {
      provide: PolicyTemplateInstanceReader,
      useFactory: (policyTemplateInstanceRepo: any) =>
        new PolicyTemplateInstanceReader(policyTemplateInstanceRepo),
      inject: [SYMBOLS.REPO.POLICY_TEMPLATE_INSTANCE]
    },
    {
      provide: PolicyTemplateInstanceAuthorizationService,
      useFactory: (reader: PolicyTemplateInstanceReader) =>
        new PolicyTemplateInstanceAuthorizationService(reader),
      inject: [PolicyTemplateInstanceReader]
    },
    ResourceAuthorizationService,
    PolicyInstancePreviewService,
    {
      provide: ACCOUNT_AUTHORIZATION_SERVICE,
      useFactory: (roleRepo: any, permRepo: any) =>
        new AccountAuthorizationService(roleRepo, permRepo),
      inject: [SYMBOLS.REPO.ROLE, SYMBOLS.REPO.PERMISSION]
    },
    {
      provide: ExecutionTokenVerifier,
      useFactory: () => createLazyTrustedExecutionRuntime(PERMISSION_SERVICE_AUDIENCE).verifier
    },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () =>
        createLazyTrustedExecutionRuntime(PERMISSION_SERVICE_AUDIENCE).workloadIdentityProvider
    },
    PermissionTrustedInternalExecutionGuard,
    PermissionDecisionPolicy,
    {
      provide: SYMBOLS.REPO.PRINCIPAL_AUTHORIZATION,
      useFactory: (prisma: PrismaService) => new PrismaPrincipalAuthorizationRepository(prisma),
      inject: [PrismaService]
    },
    {
      provide: SYMBOLS.REPO.WORKLOAD_ISSUANCE_POLICY,
      useFactory: () =>
        new EnvironmentWorkloadIssuancePolicyRepository(
          process.env.PERMISSION_WORKLOAD_ISSUANCE_POLICIES
        )
    },
    {
      provide: PERMISSION_DECISION_AUDIT_PORT,
      useExisting: PermissionAuditService
    },
    {
      provide: PERMISSION_AUTH_SERVICE_SPIFFE_ID,
      useFactory: requireExactAuthSpiffeId
    },
    { provide: PERMISSION_DECISION_TARGET_AUDIENCE, useValue: PERMISSION_SERVICE_AUDIENCE },
    PermissionDecisionTransportGuard,
    ValidatingQueryBus,
    ...AccessSummaryQueryHandlers,
    ...TerminalAccessRuntimeQueryHandlers,
    ...AuthorizationQueryHandlers
  ],
  controllers: [
    PermissionCheckGrpcController,
    PermissionAccessSummaryGrpcController,
    PermissionTerminalAccessGrpcController,
    PolicyInstancePreviewGrpcController,
    ResourceAuthorizationGrpcController
  ],
  exports: [ResourceAuthorizationService]
})
export class AuthorizationModule {}

/** Loads the exact deployment-registered Auth identity and rejects wildcard bootstrap trust. */
function requireExactAuthSpiffeId(): string {
  const value = process.env.PERMISSION_AUTH_SERVICE_SPIFFE_ID?.trim()
  if (!value || !value.startsWith('spiffe://') || value.includes('*')) {
    throw new Error('PERMISSION_AUTH_SERVICE_SPIFFE_ID must be an exact SPIFFE ID')
  }
  return value
}
