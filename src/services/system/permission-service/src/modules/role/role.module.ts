import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from 'src/infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs/index'
import { RoleCommandHandlers } from 'src/application/commands/role'
import { RoleQueryHandlers } from 'src/application/queries/role'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    {
      provide: SYMBOLS.REPO.PERMISSION,
      useClass: PrismaPermissionRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...RoleCommandHandlers,
    ...RoleQueryHandlers
  ],
  controllers: [],
  exports: [SYMBOLS.REPO.ROLE]
})
export class RoleModule {}
