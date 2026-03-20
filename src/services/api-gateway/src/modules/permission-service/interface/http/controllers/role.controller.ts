import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PermissionProxyService } from '../../../permission-service.service'

@ApiBearerAuth('JWT')
@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('all')
  @ApiOperation({ summary: 'List all roles' })
  async getAllRoles() {
    return this.permissionService.listRoles()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find role by ID' })
  async findById(@Param('id') id: string) {
    return this.permissionService.getRoleById({ id })
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id') id: string) {
    return this.permissionService.deleteRole({ id })
  }
}
