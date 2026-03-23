import { Controller, Delete, Get, Param, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { PermissionProxyService } from '../../../permission-service.service'

@ApiBearerAuth('JWT')
@ApiTags('role')
@Controller('role')
export class RoleController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('all')
  @ApiOperation({ summary: 'List all roles' })
  async getAllRoles(@Req() req: Request) {
    return this.permissionService.listRoles(this.operatorSource(req))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find role by ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.permissionService.getRoleById({ id }, this.operatorSource(req))
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  async deleteRole(@Param('id') id: string, @Req() req: Request) {
    return this.permissionService.deleteRole({ id }, this.operatorSource(req))
  }

  private operatorSource(req: Request) {
    return {
      user: req['user'],
      requestId: req.header('x-request-id') ?? undefined,
      traceId: req.header('x-trace-id') ?? undefined
    }
  }
}
