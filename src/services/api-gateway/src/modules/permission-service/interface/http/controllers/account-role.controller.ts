import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  PermissionCheckAll
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { AssignAccountRoleDto } from '../dtos/assign-account-role.dto'
import { ListAccountRolesDto } from '../dtos/list-account-roles.dto'
import { SetAccountRolesDto } from '../dtos/set-account-roles.dto'

@ApiBearerAuth('JWT')
@ApiTags('account-role')
@Controller()
// Exposes account-role management endpoints through the gateway permission proxy.
export class AccountRoleController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('account/:accountId/roles')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE])
  @ApiOperation({ summary: 'List effective roles currently assigned to one account' })
  async listAccountRoles(
    @Param('accountId') accountId: string,
    @Query() query: ListAccountRolesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listAccountRoles(
        {
          accountId,
          tenantId: query.tenantId,
          scopeLevel: query.scopeLevel
        },
        source
      )
    )
  }

  @Get('account/:accountId/roles/selection')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE])
  @ApiOperation({ summary: 'Get assignable roles and selected role ids for one account' })
  async getAccountRoleSelection(
    @Param('accountId') accountId: string,
    @Query() query: ListAccountRolesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.getAccountRoleSelection(
        {
          accountId,
          tenantId: query.tenantId,
          scopeLevel: query.scopeLevel
        },
        source
      )
    )
  }

  @Post('account/:accountId/roles')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.ASSIGN_ACCOUNT_ROLE])
  @ApiOperation({ summary: 'Assign one role instance to one account' })
  @ApiBody({ type: AssignAccountRoleDto })
  async assignAccountRole(
    @Param('accountId') accountId: string,
    @Body() body: AssignAccountRoleDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.assignAccountRole(
        {
          accountId,
          accountType: body.accountType,
          roleId: body.roleId,
          tenantId: body.tenantId || '',
          scopeLevel: body.scopeLevel,
          effectiveAt: body.effectiveAt,
          expiresAt: body.expiresAt
        },
        source
      )
    )
  }

  @Delete('account/:accountId/roles/:roleId')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.REVOKE_ACCOUNT_ROLE])
  @ApiOperation({ summary: 'Revoke one role instance from one account' })
  async revokeAccountRole(
    @Param('accountId') accountId: string,
    @Param('roleId') roleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.revokeAccountRole(
        {
          accountId,
          roleId
        },
        source
      )
    )
  }

  @Put('account/:accountId/roles')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.SET_ACCOUNT_ROLES])
  @ApiOperation({ summary: 'Replace the effective role set for one account within one scope' })
  @ApiBody({ type: SetAccountRolesDto })
  async setAccountRoles(
    @Param('accountId') accountId: string,
    @Body() body: SetAccountRolesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setAccountRoles(
        {
          accountId,
          accountType: body.accountType,
          tenantId: body.tenantId || '',
          scopeLevel: body.scopeLevel,
          roleIds: body.roleIds
        },
        source
      )
    )
  }

  @Get('role/:roleId/accounts')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE])
  @ApiOperation({ summary: 'List account bindings that currently reference one role instance' })
  async listRoleAccounts(
    @Param('roleId') roleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.listRoleAccounts({ roleId }, source))
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
