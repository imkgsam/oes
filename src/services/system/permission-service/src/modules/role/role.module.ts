import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from 'src/infrastructure/repositories/prisma/prisma.role.repository'
import { SYMBOLS } from 'src/common/constants/symbols'
import { ValidatingCommandBus, ValidatingQueryBus } from 'src/application/cqrs'
import { RoleCommandHandlers } from 'src/application/commands/role'
import { RoleQueryHandlers } from 'src/application/queries/role'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ROLE,
      useClass: PrismaRoleRepository
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    ...RoleCommandHandlers,
    ...RoleQueryHandlers
  ],
  controllers: [],
  exports: [ValidatingCommandBus, ValidatingQueryBus]
})
export class RoleModule {}
