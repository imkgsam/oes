import { Module } from '@nestjs/common'
import { PermissionService } from 'src/application/services/permission.service'
import {
  CheckUserPermissionUseCase,
  CreatePermissionUseCase,
  ListPermissionsUseCase,
} from 'src/application/use-cases/permission.use-case'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { PrismaRolePermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.role-permission.repository'
import { PrismaUserRoleRepository } from 'src/infrastructure/repositories/prisma/prisma.user-role.repository'
import { HttpPermissionController } from 'src/interfaces/http/controllers/http.permission.controller'
import { TcpPermissionController } from 'src/interfaces/tcp/controllers/tcp.permission.controller'
@Module({
  imports: [PrismaModule],
  providers: [
    { provide: 'PermissionRepository', useClass: PrismaPermissionRepository },
    { provide: 'UserRoleRepository', useClass: PrismaUserRoleRepository },
    { provide: 'RolePermissionRepository', useClass: PrismaRolePermissionRepository },
    PermissionService,
    ListPermissionsUseCase,
    CreatePermissionUseCase,
    CreatePermissionUseCase,
    CheckUserPermissionUseCase,
  ],
  controllers: [HttpPermissionController, TcpPermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
