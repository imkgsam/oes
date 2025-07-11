import { Module } from '@nestjs/common'
import { PrismaClient } from 'prisma/generated/prisma'
import { PermissionService } from 'src/application/services/permission.service'
import { PrismaPermissionRepository } from 'src/infrastructure/repositories/prisma/prisma.permission.repository'
import { HttpPermissionController } from 'src/interfaces/http/controllers/http.permission.controller'
import { TcpPermissionController } from 'src/interfaces/tcp/controllers/tcp.permission.controller'
@Module({
  imports: [PrismaClient],
  providers: [{ provide:"PermissionRepository", useClass:PrismaPermissionRepository },PermissionService],
  controllers: [HttpPermissionController, TcpPermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
