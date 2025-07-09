import { Module } from '@nestjs/common';
import { PermissionController } from 'src/interfaces/http/controllers/permission.controller';

@Module({
  providers: [PermissionService],
  controllers: [PermissionController],
})
export class PermissionModule {}
