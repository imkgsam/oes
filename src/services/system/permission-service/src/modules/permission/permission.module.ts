import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { PermissionCommandHandlers } from '../../application/commands/permission'
import { NavigationCommandHandlers } from '../../application/commands/navigation'
import { PermissionQueryHandlers } from '../../application/queries/permission'
import { NavigationQueryHandlers } from '../../application/queries/navigation'
import { AuditQueryHandlers } from '../../application/queries/audit'
import { PermissionManagementGrpcController } from '../../interfaces/grpc/permission-management.grpc.controller'
import { ManagementAuthorizationModule } from '../management-authorization/management-authorization.module'
import { RoleModule } from '../role/role.module'
import { PermissionAuditModule } from '../audit/permission-audit.module'
import { PrismaNavigationRepository } from '../../infrastructure/repositories/prisma/prisma.navigation.repository'
import { NavigationResolverService } from '../../domain/services/navigation-resolver.service'

@Module({
  imports: [CqrsModule, PrismaModule, ManagementAuthorizationModule, RoleModule, PermissionAuditModule],
  providers: [
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    {
      provide: SYMBOLS.REPO.NAVIGATION,
      useClass: PrismaNavigationRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    NavigationResolverService,
    ...PermissionCommandHandlers,
    ...NavigationCommandHandlers,
    ...PermissionQueryHandlers,
    ...NavigationQueryHandlers,
    ...AuditQueryHandlers
  ],
  controllers: [PermissionManagementGrpcController],
  exports: [SYMBOLS.REPO.PERMISSION, SYMBOLS.REPO.NAVIGATION]
})
export class PermissionModule {}
