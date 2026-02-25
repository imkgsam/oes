import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport/grpc/grpc-client.decorator'
import { CreateRoleDto } from 'src/modules/permission-service/interface/http/dtos/create-role.dto'

@ApiBearerAuth('JWT')
@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(
    @InjectGrpcClient('permission-service')
    private readonly permissionClient: ClientGrpc
  ) {}

  // TODO: bind gRPC service stubs after proto definitions are finalized

  @Get('all')
  @ApiOperation({ summary: 'List all roles' })
  async getAllRoles() {
    // return safeGrpcCall(this.permissionSvc.listRoles({}), { ... })
  }

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  async createRole(@Body() _dto: CreateRoleDto) {
    // return safeGrpcCall(this.permissionSvc.createRole(dto), { ... })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find role by ID' })
  async findById(@Param('id') _id: string) {
    // return safeGrpcCall(this.permissionSvc.getRoleById({ id }), { ... })
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id') _id: string) {
    // return safeGrpcCall(this.permissionSvc.deleteRole({ id }), { ... })
  }
}
