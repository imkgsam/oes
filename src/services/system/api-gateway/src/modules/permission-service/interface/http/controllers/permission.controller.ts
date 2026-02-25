import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport/grpc/grpc-client.decorator'
import { CreatePermissionDto } from 'src/modules/permission-service/interface/http/dtos/create-permission.dto'

@ApiBearerAuth('JWT')
@ApiTags('permission')
@Controller('permission')
export class PermissionController {
  constructor(
    @InjectGrpcClient('permission-service')
    private readonly permissionClient: ClientGrpc
  ) {}

  // TODO: bind gRPC service stubs after proto definitions are finalized

  @Get('all')
  @ApiOperation({ summary: 'List all permissions' })
  async getAllPermissions() {
    // return safeGrpcCall(this.permissionSvc.listPermissions({}), { ... })
  }

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  async createPermission(@Body() _dto: CreatePermissionDto) {
    // return safeGrpcCall(this.permissionSvc.createPermission(dto), { ... })
  }

  @Get('by-module')
  @ApiOperation({ summary: 'Find permissions by module' })
  async findByModule(@Query('module') _module: string) {
    // return safeGrpcCall(this.permissionSvc.getPermissionsByModule({ module }), { ... })
  }

  @Get(':code')
  @ApiOperation({ summary: 'Find permission by code' })
  async findByCode(@Param('code') _code: string) {
    // return safeGrpcCall(this.permissionSvc.getPermissionByCode({ code }), { ... })
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  async delete(@Param('id') _id: string) {
    // return safeGrpcCall(this.permissionSvc.deletePermission({ id }), { ... })
  }
}
