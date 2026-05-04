import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PermissionCheckAll,
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  ROLE_INSTANCE_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PermissionProxyService } from '../../../permission-service.service'
import {
  CreateNavigationEntryDto,
  ListNavigationEntriesDto,
  ResolveNavigationPreviewDto,
  SetRoleLandingPoliciesDto,
  SetRoleNavigationVisibilityDto,
  UpdateNavigationEntryDto
} from '../dtos/navigation-management.dto'

// Exposes navigation governance management endpoints through the gateway permission proxy.
@ApiBearerAuth('JWT')
@ApiTags('navigation-management')
@Controller()
export class NavigationController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Get('navigation/entries')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY])
  @ApiOperation({ summary: 'List managed navigation entries' })
  async listNavigationEntries(
    @Query() query: ListNavigationEntriesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.listNavigationEntries(
        {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          keyword: query.keyword,
          featureKey: query.featureKey,
          terminal: query.terminal,
          hasEnabledFilter: query.enabled !== undefined,
          enabled: query.enabled
        },
        source
      )
    )
  }

  @Post('navigation/entries')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.CREATE_NAVIGATION_ENTRY])
  @ApiOperation({ summary: 'Create a managed navigation entry' })
  @ApiBody({ type: CreateNavigationEntryDto })
  async createNavigationEntry(
    @Body() body: CreateNavigationEntryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.createNavigationEntry(body, source))
  }

  @Get('navigation/entries/:entryKey')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_NAVIGATION_ENTRY_DETAIL])
  @ApiOperation({ summary: 'Get a managed navigation entry' })
  async getNavigationEntry(
    @Param('entryKey') entryKey: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getNavigationEntry({ entryKey }, source))
  }

  @Patch('navigation/entries/:entryKey')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.UPDATE_NAVIGATION_ENTRY])
  @ApiOperation({ summary: 'Update a managed navigation entry' })
  @ApiBody({ type: UpdateNavigationEntryDto })
  async updateNavigationEntry(
    @Param('entryKey') entryKey: string,
    @Body() body: UpdateNavigationEntryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.updateNavigationEntry(
        {
          entryKey,
          name: body.name,
          description: body.description,
          featureKey: body.featureKey,
          supportedTerminals: body.supportedTerminals,
          registryPriority: body.registryPriority,
          enabled: body.enabled,
          entryType: body.entryType
        },
        source
      )
    )
  }

  @Get('roles/:roleId/navigation')
  @PermissionCheckAll([ROLE_INSTANCE_PERMISSION_CODES.GET_BY_ID])
  @ApiOperation({ summary: 'Get role navigation config' })
  async getRoleNavigation(
    @Param('roleId') roleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.getRoleNavigation({ roleId }, source))
  }

  @Put('roles/:roleId/navigation/visibility')
  @PermissionCheckAll([ROLE_INSTANCE_PERMISSION_CODES.UPDATE])
  @ApiOperation({ summary: 'Replace role navigation visibility config' })
  @ApiBody({ type: SetRoleNavigationVisibilityDto })
  async setRoleNavigationVisibility(
    @Param('roleId') roleId: string,
    @Body() body: SetRoleNavigationVisibilityDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setRoleNavigationVisibility(
        {
          roleId,
          visibility: body.visibility
        },
        source
      )
    )
  }

  @Put('roles/:roleId/navigation/landing-policies')
  @PermissionCheckAll([ROLE_INSTANCE_PERMISSION_CODES.UPDATE])
  @ApiOperation({ summary: 'Replace role landing policy config' })
  @ApiBody({ type: SetRoleLandingPoliciesDto })
  async setRoleLandingPolicies(
    @Param('roleId') roleId: string,
    @Body() body: SetRoleLandingPoliciesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.setRoleLandingPolicies(
        {
          roleId,
          landingPolicies: body.landingPolicies
        },
        source
      )
    )
  }

  @Post('roles/:roleId/navigation/sync-template')
  @PermissionCheckAll([ROLE_INSTANCE_PERMISSION_CODES.SYNC_FROM_TEMPLATE])
  @ApiOperation({ summary: 'Reset role navigation config to the linked template snapshot' })
  async syncRoleNavigationFromTemplate(
    @Param('roleId') roleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() =>
      this.permissionService.syncRoleNavigationFromTemplate(
        {
          roleId
        },
        source
      )
    )
  }

  @Post('navigation/resolve-preview')
  @PermissionCheckAll([PERMISSION_MANAGEMENT_PERMISSION_CODES.RESOLVE_NAVIGATION_PREVIEW])
  @ApiOperation({ summary: 'Preview resolved navigation entries and default landing entry' })
  @ApiBody({ type: ResolveNavigationPreviewDto })
  async resolveNavigationPreview(
    @Body() body: ResolveNavigationPreviewDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.execute(() => this.permissionService.resolveNavigationPreview(body, source))
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work()
    } catch (error) {
      throw error
    }
  }
}
