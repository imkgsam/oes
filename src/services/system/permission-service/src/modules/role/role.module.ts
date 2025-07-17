import { Module } from '@nestjs/common'
import { RoleService } from 'src/application/services/role.service'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaRoleRepository } from 'src/infrastructure/repositories/prisma/prisma.role.repository'
import { TcpRoleController } from 'src/interfaces/tcp/controllers/tcp.role.controller'
import { TcpTestController } from 'src/interfaces/tcp/controllers/tcp.test.controller'

@Module({
  imports: [PrismaModule],
  providers: [
    RoleService,
    {
      provide: 'RoleRepository',
      useClass: PrismaRoleRepository,
    },
  ],
  controllers: [TcpRoleController, TcpTestController],
  exports: [],
})
export class RoleModule { }
