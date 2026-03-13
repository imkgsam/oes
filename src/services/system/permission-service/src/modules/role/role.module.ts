import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from '../../infrastructure/repositories/prisma/prisma.role.repository'
import { PrismaPermissionRepository } from '../../infrastructure/repositories/prisma/prisma.permission.repository'
import { SYMBOLS } from '../../common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { RoleCommandHandlers } from '../../application/commands/role'
import { RoleQueryHandlers } from '../../application/queries/role'

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
