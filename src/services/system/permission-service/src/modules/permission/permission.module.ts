import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { TcpPermissionController } from 'src/interfaces/tcp/controllers/tcp.permission.controller'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from 'src/application/cqrs'
import { PermissionCommandHandlers } from 'src/application/commands/permission'
import { PermissionQueryHandlers } from 'src/application/queries/permission'
import { AuthorizationQueryHandlers } from 'src/application/queries/authorization'

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
    ...AuthorizationQueryHandlers
  ],
  controllers: [TcpPermissionController],
  exports: [ValidatingCommandBus, ValidatingQueryBus]
})
export class PermissionModule {}
