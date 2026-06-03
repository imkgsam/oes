import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, MES_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { MesService } from '../../../mes.service'
import {
  ActivateProductionSpecDto,
  AcceptProductionMoldDto,
  ConfirmInstalledMoldReadyDto,
  ConfirmProductionMoldArrivalDto,
  CreateProductionSpecDto,
  GetMoldUsageHistoryDto,
  InstallToolingDto,
  ListCurrentMoldsByWorkCenterDto,
  ListMasterMoldsDto,
  ListMoldDesignsDto,
  ListMoldLifeCountersDto,
  ListProductionMoldsByDesignDto,
  ListProductionMoldsDto,
  ListProductionSpecsDto,
  MarkInstalledMoldMaintenanceDto,
  MarkProductionMoldForScrapDto,
  MoveToolingDto,
  PrintDailyMoldChecklistDto,
  RecordDailyMoldUsageBatchDto,
  RegisterMasterMoldDto,
  RegisterMoldDesignDto,
  RegisterProductionMoldDto,
  RetireProductionSpecDto,
  UnmountToolingDto,
  UpdateProductionSpecDto
} from '../dtos/mes.dto'

@ApiBearerAuth('JWT')
@ApiTags('mes')
@Controller('mes/tenants/:tenantId')
// Exposes the tenant-scoped MES mold-management BFF surface for the first-stage web workflow.
export class MesController {
  constructor(private readonly mesService: MesService) {}

  @Get('production-specs')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'List MES production specs for mold setup' })
  async listProductionSpecs(
    @Param('tenantId') tenantId: string,
    @Query() query: ListProductionSpecsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listProductionSpecs(tenantId, query, source)
  }

  @Get('production-specs/:productionSpecId')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'Get one MES production spec detail snapshot' })
  async getProductionSpec(
    @Param('tenantId') tenantId: string,
    @Param('productionSpecId') productionSpecId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getProductionSpec(tenantId, productionSpecId, source)
  }

  @Post('production-specs')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'Create one MES production spec draft' })
  @ApiBody({ type: CreateProductionSpecDto })
  async createProductionSpec(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateProductionSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.createProductionSpec(tenantId, body, source)
  }

  @Post('production-specs/:productionSpecId/activate')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'Activate one MES production spec' })
  @ApiBody({ type: ActivateProductionSpecDto })
  async activateProductionSpec(
    @Param('tenantId') tenantId: string,
    @Param('productionSpecId') productionSpecId: string,
    @Body() body: ActivateProductionSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.activateProductionSpec(tenantId, productionSpecId, body, source)
  }

  @Post('production-specs/:productionSpecId/update')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'Update one MES production spec' })
  @ApiBody({ type: UpdateProductionSpecDto })
  async updateProductionSpec(
    @Param('tenantId') tenantId: string,
    @Param('productionSpecId') productionSpecId: string,
    @Body() body: UpdateProductionSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.updateProductionSpec(tenantId, productionSpecId, body, source)
  }

  @Post('production-specs/:productionSpecId/retire')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_SPEC] })
  @ApiOperation({ summary: 'Retire one MES production spec' })
  @ApiBody({ type: RetireProductionSpecDto })
  async retireProductionSpec(
    @Param('tenantId') tenantId: string,
    @Param('productionSpecId') productionSpecId: string,
    @Body() body: RetireProductionSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.retireProductionSpec(tenantId, productionSpecId, body, source)
  }

  @Get('mold-designs')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN] })
  @ApiOperation({ summary: 'List MES mold designs' })
  async listMoldDesigns(
    @Param('tenantId') tenantId: string,
    @Query() query: ListMoldDesignsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listMoldDesigns(tenantId, query, source)
  }

  @Get('mold-designs/:moldDesignId')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN] })
  @ApiOperation({ summary: 'Get one MES mold design detail snapshot' })
  async getMoldDesign(
    @Param('tenantId') tenantId: string,
    @Param('moldDesignId') moldDesignId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getMoldDesign(tenantId, moldDesignId, source)
  }

  @Post('mold-designs')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN] })
  @ApiOperation({ summary: 'Register one MES mold design' })
  @ApiBody({ type: RegisterMoldDesignDto })
  async registerMoldDesign(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterMoldDesignDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.registerMoldDesign(tenantId, body, source)
  }

  @Post('master-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Register one MES master mold' })
  @ApiBody({ type: RegisterMasterMoldDto })
  async registerMasterMold(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterMasterMoldDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.registerMasterMold(tenantId, body, source)
  }

  @Get('master-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'List MES master molds' })
  async listMasterMolds(
    @Param('tenantId') tenantId: string,
    @Query() query: ListMasterMoldsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listMasterMolds(tenantId, query, source)
  }

  @Get('master-molds/:masterMoldId')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Get one MES master mold result object' })
  async getMasterMold(
    @Param('tenantId') tenantId: string,
    @Param('masterMoldId') masterMoldId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getMasterMold(tenantId, masterMoldId, source)
  }

  @Post('production-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Register one MES production mold' })
  @ApiBody({ type: RegisterProductionMoldDto })
  async registerProductionMold(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterProductionMoldDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.registerProductionMold(tenantId, body, source)
  }

  @Post('production-molds/:productionMoldId/accept')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Accept one received MES production mold' })
  @ApiBody({ type: AcceptProductionMoldDto })
  async acceptProductionMold(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Body() body: AcceptProductionMoldDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.acceptProductionMold(tenantId, productionMoldId, body, source)
  }

  @Post('production-molds/:productionMoldId/confirm-arrival')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Confirm one pre-registered MES production mold has arrived' })
  @ApiBody({ type: ConfirmProductionMoldArrivalDto })
  async confirmProductionMoldArrival(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Body() body: ConfirmProductionMoldArrivalDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.confirmProductionMoldArrival(tenantId, productionMoldId, body, source)
  }

  @Get('production-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'List MES production molds' })
  async listProductionMolds(
    @Param('tenantId') tenantId: string,
    @Query() query: ListProductionMoldsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listProductionMolds(tenantId, query, source)
  }

  @Get('mold-designs/:moldDesignId/production-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'List MES production molds by mold design' })
  async listProductionMoldsByDesign(
    @Param('tenantId') tenantId: string,
    @Param('moldDesignId') moldDesignId: string,
    @Query() query: ListProductionMoldsByDesignDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listProductionMoldsByDesign(tenantId, moldDesignId, query, source)
  }

  @Get('production-molds/:productionMoldId')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Get one MES production mold detail snapshot' })
  async getProductionMold(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getProductionMold(tenantId, productionMoldId, source)
  }

  @Get('tooling/:toolingId/current-placement')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Get one MES tooling current placement' })
  async getToolingCurrentPlacement(
    @Param('tenantId') tenantId: string,
    @Param('toolingId') toolingId: string,
    @Query() query: MoveToolingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getToolingCurrentPlacement(tenantId, toolingId, query, source)
  }

  @Post('tooling/:toolingId/move')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Move one MES tooling object to storage or carrier resource' })
  @ApiBody({ type: MoveToolingDto })
  async moveTooling(
    @Param('tenantId') tenantId: string,
    @Param('toolingId') toolingId: string,
    @Body() body: MoveToolingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.moveTooling(tenantId, toolingId, body, source)
  }

  @Post('tooling/:toolingId/install')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Install one MES tooling object on a work center or work unit' })
  @ApiBody({ type: InstallToolingDto })
  async installTooling(
    @Param('tenantId') tenantId: string,
    @Param('toolingId') toolingId: string,
    @Body() body: InstallToolingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.installTooling(tenantId, toolingId, body, source)
  }

  @Post('tooling-installations/:toolingInstallationId/unmount')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Unmount one MES tooling installation' })
  @ApiBody({ type: UnmountToolingDto })
  async unmountTooling(
    @Param('tenantId') tenantId: string,
    @Param('toolingInstallationId') toolingInstallationId: string,
    @Body() body: UnmountToolingDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.unmountTooling(tenantId, toolingInstallationId, body, source)
  }

  @Post('production-molds/:productionMoldId/confirm-ready')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Confirm one installed MES production mold is ready for usage recording' })
  @ApiBody({ type: ConfirmInstalledMoldReadyDto })
  async confirmInstalledMoldReady(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Body() body: ConfirmInstalledMoldReadyDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.confirmInstalledMoldReady(tenantId, productionMoldId, body, source)
  }

  @Post('production-molds/:productionMoldId/mark-maintenance')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'Mark one ready installed MES production mold as maintenance' })
  @ApiBody({ type: MarkInstalledMoldMaintenanceDto })
  async markInstalledMoldMaintenance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Body() body: MarkInstalledMoldMaintenanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.markInstalledMoldMaintenance(tenantId, productionMoldId, body, source)
  }

  @Post('production-molds/:productionMoldId/mark-for-scrap')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Mark one MES production mold for scrap' })
  @ApiBody({ type: MarkProductionMoldForScrapDto })
  async markProductionMoldForScrap(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Body() body: MarkProductionMoldForScrapDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.markProductionMoldForScrap(tenantId, productionMoldId, body, source)
  }

  @Get('work-centers/:workCenterId/current-molds')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_TOOLING_INSTALLATION] })
  @ApiOperation({ summary: 'List current molds installed on one MES work center' })
  async listCurrentMoldsByWorkCenter(
    @Param('tenantId') tenantId: string,
    @Param('workCenterId') workCenterId: string,
    @Query() query: ListCurrentMoldsByWorkCenterDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listCurrentMoldsByWorkCenter(tenantId, workCenterId, query, source)
  }

  @Get('mold-life-counters')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_LIFE] })
  @ApiOperation({ summary: 'List MES mold life counters' })
  async listMoldLifeCounters(
    @Param('tenantId') tenantId: string,
    @Query() query: ListMoldLifeCountersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listMoldLifeCounters(tenantId, query, source)
  }

  @Get('production-molds/:productionMoldId/usage-history')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD] })
  @ApiOperation({ summary: 'Get one production mold usage history' })
  async getMoldUsageHistory(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldId') productionMoldId: string,
    @Query() query: GetMoldUsageHistoryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getMoldUsageHistory(tenantId, productionMoldId, query, source)
  }

  @Get('daily-mold-checklists')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.READ_TOOLING_INSTALLATION] })
  @ApiOperation({
    summary: 'Print the daily MES mold checklist for web-stage manual usage capture'
  })
  async printDailyMoldChecklist(
    @Param('tenantId') tenantId: string,
    @Query() query: PrintDailyMoldChecklistDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.printDailyMoldChecklist(tenantId, query, source)
  }

  @Post('daily-mold-checklists/:checklistDate/usage-batch')
  @RequirePermissions({ all: [MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE] })
  @ApiOperation({
    summary: 'Record checked daily mold usage rows as idempotent MES usage commands'
  })
  @ApiBody({ type: RecordDailyMoldUsageBatchDto })
  async recordDailyMoldUsageBatch(
    @Param('tenantId') tenantId: string,
    @Param('checklistDate') checklistDate: string,
    @Body() body: RecordDailyMoldUsageBatchDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.recordDailyMoldUsageBatch(tenantId, checklistDate, body, source)
  }
}
