import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { PermissionCommandHandlers } from '../../application/commands/permission'
import { PermissionQueryHandlers } from '../../application/queries/permission'
import { PermissionManagementGrpcController } from '../../interfaces/grpc/permission-management.grpc.controller'
import { ManagementAuthorizationModule } from '../management-authorization/management-authorization.module'

@Module({
  imports: [CqrsModule, PrismaModule, ManagementAuthorizationModule],
  providers: [
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...PermissionCommandHandlers,
    ...PermissionQueryHandlers
  ],
  controllers: [PermissionManagementGrpcController],
  exports: [SYMBOLS.REPO.PERMISSION]
})
export class PermissionModule {}
