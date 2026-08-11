import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PdaDeviceEnrollmentUseCase } from '../../../application/use-cases/pda-device-enrollment.use-case'
import { PdaDeviceHeartbeatUseCase } from '../../../application/use-cases/pda-device-heartbeat.use-case'
import { PdaDeviceLogsUseCase } from '../../../application/use-cases/pda-device-logs.use-case'
import { PdaDeviceLogsDto, PdaEnrollmentDto, PdaHeartbeatDto } from '../dtos/pda-device.dto'
import {
  PdaDeviceLogsViewModel,
  PdaEnrollmentViewModel,
  PdaHeartbeatViewModel
} from '../view-models/pda-device.view-model'

@ApiTags('pda-device')
@Controller('pda/device')
// Exposes PDA device diagnostics endpoints without owning long-term device registry truth.
export class PdaDeviceController {
  constructor(
    private readonly enrollmentUseCase: PdaDeviceEnrollmentUseCase,
    private readonly heartbeatUseCase: PdaDeviceHeartbeatUseCase,
    private readonly logsUseCase: PdaDeviceLogsUseCase
  ) {}

  @Post('enroll')
  @Public()
  @ApiOperation({ summary: 'Activate a managed PDA device enrollment code' })
  @ApiBody({ type: PdaEnrollmentDto })
  @ApiResponse({ status: 201, type: PdaEnrollmentViewModel })
  enroll(
    @Body() dto: PdaEnrollmentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PdaEnrollmentViewModel> {
    return this.enrollmentUseCase.execute(dto, source)
  }

  @Post('heartbeat')
  @Public()
  @ApiOperation({ summary: 'Record the latest PDA device heartbeat diagnostic state' })
  @ApiBody({ type: PdaHeartbeatDto })
  @ApiResponse({ status: 201, type: PdaHeartbeatViewModel })
  heartbeat(@Body() dto: PdaHeartbeatDto, @DownstreamSource() source: DownstreamRequestSource): Promise<PdaHeartbeatViewModel> {
    return this.heartbeatUseCase.execute(dto, source)
  }

  @Post('logs')
  @Public()
  @ApiOperation({ summary: 'Accept manually uploaded PDA diagnostic logs' })
  @ApiBody({ type: PdaDeviceLogsDto })
  @ApiResponse({ status: 201, type: PdaDeviceLogsViewModel })
  logs(@Body() dto: PdaDeviceLogsDto, @DownstreamSource() source: DownstreamRequestSource): Promise<PdaDeviceLogsViewModel> {
    return this.logsUseCase.execute(dto, source)
  }
}
