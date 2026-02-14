import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs/index'
import { PermissionCommandHandlers } from 'src/application/commands/permission'
import { PermissionQueryHandlers } from 'src/application/queries/permission'
import { AuthorizationQueryHandlers } from 'src/application/queries/authorization'
import { PermissionCheckController } from 'src/interfaces/grpc/permission-check.grpc.controller'
import { AppLogger } from '@oes/common/logging/app-logger.service'
@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...PermissionCommandHandlers,
    ...PermissionQueryHandlers,
    ...AuthorizationQueryHandlers,
    AppLogger
  ],
  controllers: [PermissionCheckController],
  exports: [ValidatingCommandBus, ValidatingQueryBus]
})
export class PermissionModule {}
