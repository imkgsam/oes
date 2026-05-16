import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { TerminalDeviceAdminUseCase } from '../../../application/use-cases/terminal-device-admin.use-case'
import {
  ChangeTerminalDeviceStatusDto,
  CreateTerminalDeviceEnrollmentDto,
  ListTerminalDeviceEnrollmentsQueryDto,
  ListTerminalDevicesQueryDto,
  RevokeTerminalDeviceEnrollmentDto,
  TerminalDeviceAuditEventsQueryDto,
  TerminalDeviceVersionPolicyQueryDto,
  UpdateTerminalDeviceDto,
  UpdateTerminalDeviceVersionPolicyDto
} from '../dtos/terminal-device-admin.dto'
import { TerminalDeviceAdminObjectViewModel } from '../view-models/terminal-device-admin.view-model'

@ApiTags('admin-terminal-device')
@Controller('admin/terminal-devices')
// Exposes tenant-web terminal device management endpoints while delegating truth to downstream services.
export class TerminalDeviceAdminController {
  constructor(private readonly useCase: TerminalDeviceAdminUseCase) {}

  @Post('enrollments')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.CREATE_ENROLLMENT] })
  @ApiOperation({ summary: 'Create a managed terminal device enrollment' })
  @ApiBody({ type: CreateTerminalDeviceEnrollmentDto })
  @ApiResponse({ status: 201, type: TerminalDeviceAdminObjectViewModel })
  createEnrollment(@Body() dto: CreateTerminalDeviceEnrollmentDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.createEnrollment(dto, source)
  }

  @Get('enrollments')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] })
  @ApiOperation({ summary: 'List managed terminal device enrollments' })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  listEnrollments(@Query() query: ListTerminalDeviceEnrollmentsQueryDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.listEnrollments(query, source)
  }

  @Post('enrollments/:enrollmentId/revoke')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.REVOKE_ENROLLMENT] })
  @ApiOperation({ summary: 'Revoke an unused terminal device enrollment' })
  @ApiBody({ type: RevokeTerminalDeviceEnrollmentDto })
  @ApiResponse({ status: 201, type: TerminalDeviceAdminObjectViewModel })
  revokeEnrollment(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: RevokeTerminalDeviceEnrollmentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.useCase.revokeEnrollment(enrollmentId, dto, source)
  }

  @Get()
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] })
  @ApiOperation({ summary: 'List managed terminal devices' })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  listDevices(@Query() query: ListTerminalDevicesQueryDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.listDevices(query, source)
  }

  @Get('version-policy')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] })
  @ApiOperation({ summary: 'Read terminal device version policy' })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  getVersionPolicy(@Query() query: TerminalDeviceVersionPolicyQueryDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.getVersionPolicy(query, source)
  }

  @Put('version-policy')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MANAGE_VERSION_POLICY] })
  @ApiOperation({ summary: 'Update terminal device version policy' })
  @ApiBody({ type: UpdateTerminalDeviceVersionPolicyDto })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  updateVersionPolicy(@Body() dto: UpdateTerminalDeviceVersionPolicyDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.upsertVersionPolicy(dto, source)
  }

  @Get(':terminalDeviceId')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] })
  @ApiOperation({ summary: 'Read managed terminal device detail' })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  getDevice(@Param('terminalDeviceId') terminalDeviceId: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.useCase.getDevice(terminalDeviceId, source)
  }

  @Patch(':terminalDeviceId')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE] })
  @ApiOperation({ summary: 'Update managed terminal device display fields' })
  @ApiBody({ type: UpdateTerminalDeviceDto })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  updateDevice(
    @Param('terminalDeviceId') terminalDeviceId: string,
    @Body() dto: UpdateTerminalDeviceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.useCase.updateDevice(terminalDeviceId, dto, source)
  }

  @Patch(':terminalDeviceId/status')
  @RequirePermissions({
    any: [
      TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.DISABLE_DEVICE,
      TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_LOST_DEVICE,
      TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_MAINTENANCE_DEVICE,
      TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.RESTORE_ACTIVE_DEVICE
    ]
  })
  @ApiOperation({ summary: 'Change managed terminal device lifecycle status' })
  @ApiBody({ type: ChangeTerminalDeviceStatusDto })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  changeStatus(
    @Param('terminalDeviceId') terminalDeviceId: string,
    @Body() dto: ChangeTerminalDeviceStatusDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.useCase.changeStatus(terminalDeviceId, dto, source)
  }

  @Get(':terminalDeviceId/audit-events')
  @RequirePermissions({ all: [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_AUDIT] })
  @ApiOperation({ summary: 'List managed terminal device governance audit events' })
  @ApiResponse({ status: 200, type: TerminalDeviceAdminObjectViewModel })
  listAuditEvents(
    @Param('terminalDeviceId') terminalDeviceId: string,
    @Query() query: TerminalDeviceAuditEventsQueryDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.useCase.listAuditEvents(terminalDeviceId, query, source)
  }
}
