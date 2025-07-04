import { Module } from '@nestjs/common';
import { PermissionController } from './interfaces/http/permission.controller';
import { PermissionController } from './interfaces/http/controllers/permission.controller';
import { RoleController } from './interfaces/http/controllers/role.controller';

@Module({
  imports: [],
  providers: [],
  controllers: [PermissionController, RoleController],
})
export class AppModule { }
