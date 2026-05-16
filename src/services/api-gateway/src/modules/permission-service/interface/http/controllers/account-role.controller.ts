import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RequirePermissions,
  PERMISSION_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { PermissionProxyService } from '../../../permission-service.service'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { AssignAccountRoleDto } from '../dtos/assign-account-role.dto'
import { ListAccountRolesDto } from '../dtos/list-account-roles.dto'
import { SetAccountRolesDto } from '../dtos/set-account-roles.dto'
import {
  AccountTerminalAccessMutationDto,
  AccountTerminalAccessQueryDto
} from '../dtos/terminal-access.dto'

@ApiBearerAuth('JWT')
@ApiTags('account-role')
@Controller()
// Exposes account-role management endpoints through the gateway permission proxy.
export class AccountRoleController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('account/:accountId/roles')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE] })
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
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE] })
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

  @Get('account/:accountId/terminal-access')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_TERMINAL_ACCESS] })
  @ApiOperation({ summary: 'Get effective terminal access for one account' })
  async getAccountTerminalAccess(
    @Param('accountId') accountId: string,
    @Query() query: AccountTerminalAccessQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.getAccountTerminalAccess(
        {
          accountId,
          tenantId: query.tenantId || '',
          scopeLevel: query.scopeLevel
        },
        source
      )
    )
  }

  @Put('account/:accountId/terminal-access/override')
  @RequirePermissions({
    all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_TERMINAL_ACCESS]
  })
  @ApiOperation({ summary: 'Replace one account terminal access override' })
  @ApiBody({ type: AccountTerminalAccessMutationDto })
  async replaceAccountTerminalAccessOverride(
    @Param('accountId') accountId: string,
    @Body() body: AccountTerminalAccessMutationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.replaceAccountTerminalAccessOverride(
        {
          accountId,
          tenantId: body.tenantId || '',
          scopeLevel: body.scopeLevel,
          allowedTerminals: body.allowedTerminals
        },
        source
      )
    )
  }

  @Delete('account/:accountId/terminal-access/override')
  @RequirePermissions({
    all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.MANAGE_ACCOUNT_TERMINAL_ACCESS]
  })
  @ApiOperation({ summary: 'Delete one account terminal access override' })
  async deleteAccountTerminalAccessOverride(
    @Param('accountId') accountId: string,
    @Query() query: AccountTerminalAccessQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.deleteAccountTerminalAccessOverride(
        {
          accountId,
          tenantId: query.tenantId || '',
          scopeLevel: query.scopeLevel
        },
        source
      )
    )
  }

  @Post('account/:accountId/roles')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.ASSIGN_ACCOUNT_ROLE] })
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
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.REVOKE_ACCOUNT_ROLE] })
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
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.SET_ACCOUNT_ROLES] })
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
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_ACCOUNT_ROLE] })
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
