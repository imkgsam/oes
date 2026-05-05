import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MES_MANAGEMENT_PERMISSION_CODES, PermissionCheckAll } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { MesService } from '../../../mes.service'
import {
  ActivateManufacturingSpecDto,
  CreateManufacturingSpecDto,
  CreateWorkCenterDto,
  DeactivateWorkCenterDto,
  InstallProductionMoldInstanceDto,
  ListCurrentMoldsByWorkCenterDto,
  ListManufacturingSpecsDto,
  ListMoldDesignsDto,
  ListProductionMoldInstancesDto,
  ListProductionMoldInstancesByDesignDto,
  ListWorkCentersDto,
  MoveProductionMoldInstanceDto,
  PrintDailyMoldChecklistDto,
  RecordDailyMoldUsageBatchDto,
  RetireManufacturingSpecDto,
  RegisterMoldDesignDto,
  RegisterProductionMoldInstanceDto,
  ScrapProductionMoldInstanceDto,
  UpdateManufacturingSpecDto,
  UnmountProductionMoldInstanceDto
} from '../dtos/mes.dto'

@ApiBearerAuth('JWT')
@ApiTags('mes')
@Controller('mes/tenants/:tenantId')
// Exposes the tenant-scoped MES mold-management BFF surface for the first-stage web workflow.
export class MesController {
  constructor(private readonly mesService: MesService) {}

  @Get('manufacturing-specs')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'List MES manufacturing specs for mold setup' })
  async listManufacturingSpecs(
    @Param('tenantId') tenantId: string,
    @Query() query: ListManufacturingSpecsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listManufacturingSpecs(tenantId, query, source)
  }

  @Get('manufacturing-specs/:manufacturingSpecId')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'Get one MES manufacturing spec detail snapshot' })
  async getManufacturingSpec(
    @Param('tenantId') tenantId: string,
    @Param('manufacturingSpecId') manufacturingSpecId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getManufacturingSpec(tenantId, manufacturingSpecId, source)
  }

  @Post('manufacturing-specs')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'Create one MES manufacturing spec draft' })
  @ApiBody({ type: CreateManufacturingSpecDto })
  async createManufacturingSpec(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateManufacturingSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.createManufacturingSpec(tenantId, body, source)
  }

  @Post('manufacturing-specs/:manufacturingSpecId/activate')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'Activate one MES manufacturing spec' })
  @ApiBody({ type: ActivateManufacturingSpecDto })
  async activateManufacturingSpec(
    @Param('tenantId') tenantId: string,
    @Param('manufacturingSpecId') manufacturingSpecId: string,
    @Body() body: ActivateManufacturingSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.activateManufacturingSpec(tenantId, manufacturingSpecId, body, source)
  }

  @Post('manufacturing-specs/:manufacturingSpecId/update')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'Update one MES manufacturing spec' })
  @ApiBody({ type: UpdateManufacturingSpecDto })
  async updateManufacturingSpec(
    @Param('tenantId') tenantId: string,
    @Param('manufacturingSpecId') manufacturingSpecId: string,
    @Body() body: UpdateManufacturingSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.updateManufacturingSpec(tenantId, manufacturingSpecId, body, source)
  }

  @Post('manufacturing-specs/:manufacturingSpecId/retire')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC])
  @ApiOperation({ summary: 'Retire one MES manufacturing spec' })
  @ApiBody({ type: RetireManufacturingSpecDto })
  async retireManufacturingSpec(
    @Param('tenantId') tenantId: string,
    @Param('manufacturingSpecId') manufacturingSpecId: string,
    @Body() body: RetireManufacturingSpecDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.retireManufacturingSpec(tenantId, manufacturingSpecId, body, source)
  }

  @Get('work-centers')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS])
  @ApiOperation({ summary: 'List MES work centers used by mold management' })
  async listWorkCenters(
    @Param('tenantId') tenantId: string,
    @Query() query: ListWorkCentersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listWorkCenters(tenantId, query, source)
  }

  @Post('work-centers')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Create one MES work center used by mold management' })
  @ApiBody({ type: CreateWorkCenterDto })
  async createWorkCenter(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateWorkCenterDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.createWorkCenter(tenantId, body, source)
  }

  @Post('work-centers/:workCenterId/deactivate')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Deactivate one MES work center after occupancy checks' })
  @ApiBody({ type: DeactivateWorkCenterDto })
  async deactivateWorkCenter(
    @Param('tenantId') tenantId: string,
    @Param('workCenterId') workCenterId: string,
    @Body() body: DeactivateWorkCenterDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.deactivateWorkCenter(tenantId, workCenterId, body, source)
  }

  @Get('mold-designs')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN])
  @ApiOperation({ summary: 'List MES mold designs' })
  async listMoldDesigns(
    @Param('tenantId') tenantId: string,
    @Query() query: ListMoldDesignsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listMoldDesigns(tenantId, query, source)
  }

  @Get('mold-designs/:moldDesignId')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN])
  @ApiOperation({ summary: 'Get one MES mold design detail snapshot' })
  async getMoldDesign(
    @Param('tenantId') tenantId: string,
    @Param('moldDesignId') moldDesignId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getMoldDesign(tenantId, moldDesignId, source)
  }

  @Post('mold-designs')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN])
  @ApiOperation({ summary: 'Register one MES mold design' })
  @ApiBody({ type: RegisterMoldDesignDto })
  async registerMoldDesign(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterMoldDesignDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.registerMoldDesign(tenantId, body, source)
  }

  @Post('mold-instances')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Register one MES production mold instance' })
  @ApiBody({ type: RegisterProductionMoldInstanceDto })
  async registerProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterProductionMoldInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.registerProductionMoldInstance(tenantId, body, source)
  }

  @Get('mold-instances')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'List MES production mold instances' })
  async listProductionMoldInstances(
    @Param('tenantId') tenantId: string,
    @Query() query: ListProductionMoldInstancesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listProductionMoldInstances(tenantId, query, source)
  }

  @Get('mold-designs/:moldDesignId/mold-instances')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'List MES production mold instances by mold design' })
  async listProductionMoldInstancesByDesign(
    @Param('tenantId') tenantId: string,
    @Param('moldDesignId') moldDesignId: string,
    @Query() query: ListProductionMoldInstancesByDesignDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listProductionMoldInstancesByDesign(tenantId, moldDesignId, query, source)
  }

  @Get('mold-instances/:productionMoldInstanceId')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Get one MES production mold instance detail snapshot' })
  async getProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldInstanceId') productionMoldInstanceId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.getProductionMoldInstance(tenantId, productionMoldInstanceId, source)
  }

  @Post('mold-instances/:productionMoldInstanceId/move')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Move one MES production mold instance to another MES location' })
  @ApiBody({ type: MoveProductionMoldInstanceDto })
  async moveProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldInstanceId') productionMoldInstanceId: string,
    @Body() body: MoveProductionMoldInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.moveProductionMoldInstance(tenantId, productionMoldInstanceId, body, source)
  }

  @Post('mold-instances/:productionMoldInstanceId/install')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Install one MES production mold instance on a work center position' })
  @ApiBody({ type: InstallProductionMoldInstanceDto })
  async installProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldInstanceId') productionMoldInstanceId: string,
    @Body() body: InstallProductionMoldInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.installProductionMoldInstance(tenantId, productionMoldInstanceId, body, source)
  }

  @Post('mold-instances/:productionMoldInstanceId/unmount')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Unmount one MES production mold instance from its current position' })
  @ApiBody({ type: UnmountProductionMoldInstanceDto })
  async unmountProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldInstanceId') productionMoldInstanceId: string,
    @Body() body: UnmountProductionMoldInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.unmountProductionMoldInstance(tenantId, productionMoldInstanceId, body, source)
  }

  @Post('mold-instances/:productionMoldInstanceId/scrap')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE])
  @ApiOperation({ summary: 'Scrap one MES production mold instance' })
  @ApiBody({ type: ScrapProductionMoldInstanceDto })
  async scrapProductionMoldInstance(
    @Param('tenantId') tenantId: string,
    @Param('productionMoldInstanceId') productionMoldInstanceId: string,
    @Body() body: ScrapProductionMoldInstanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.scrapProductionMoldInstance(tenantId, productionMoldInstanceId, body, source)
  }

  @Get('work-centers/:workCenterId/current-molds')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS])
  @ApiOperation({ summary: 'List current molds installed on one MES work center' })
  async listCurrentMoldsByWorkCenter(
    @Param('tenantId') tenantId: string,
    @Param('workCenterId') workCenterId: string,
    @Query() query: ListCurrentMoldsByWorkCenterDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.listCurrentMoldsByWorkCenter(tenantId, workCenterId, query, source)
  }

  @Get('daily-mold-checklists')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS])
  @ApiOperation({ summary: 'Print the daily MES mold checklist for web-stage manual usage capture' })
  async printDailyMoldChecklist(
    @Param('tenantId') tenantId: string,
    @Query() query: PrintDailyMoldChecklistDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.mesService.printDailyMoldChecklist(tenantId, query, source)
  }

  @Post('daily-mold-checklists/:checklistDate/usage-batch')
  @PermissionCheckAll([MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE])
  @ApiOperation({ summary: 'Record checked daily mold usage rows as idempotent MES usage commands' })
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
