import { Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
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

const PERMISSION_SERVICE_AUDIENCE = 'urn:oes:service:permission-service'

@Module({
  imports: [
    CqrsModule,
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
    {
      provide: TrustedInternalExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        workloadIdentityProvider: GrpcWorkloadIdentityProvider
      ) =>
        new TrustedInternalExecutionGuard(
          reflector,
          verifier,
          workloadIdentityProvider,
          PERMISSION_SERVICE_AUDIENCE
        ),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    },
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
