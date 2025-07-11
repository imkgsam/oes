import { Module } from '@nestjs/common'
import { PermissionService } from 'src/application/services/permission.service'
import { HttpPermissionController } from 'src/interfaces/http/controllers/http.permission.controller'
import { TcpPermissionController } from 'src/interfaces/tcp/controllers/tcp.permission.controller'
@Module({
  providers: [PermissionService],
  controllers: [HttpPermissionController, TcpPermissionController],
})
export class PermissionModule { }
