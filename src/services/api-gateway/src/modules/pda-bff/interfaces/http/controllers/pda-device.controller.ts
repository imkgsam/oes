import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import { PdaDeviceHeartbeatUseCase } from '../../../application/use-cases/pda-device-heartbeat.use-case'
import { PdaDeviceLogsUseCase } from '../../../application/use-cases/pda-device-logs.use-case'
import { PdaDeviceLogsDto, PdaHeartbeatDto } from '../dtos/pda-device.dto'
import { PdaDeviceLogsViewModel, PdaHeartbeatViewModel } from '../view-models/pda-device.view-model'

@ApiTags('pda-device')
@Controller('pda/device')
// Exposes PDA device diagnostics endpoints without owning long-term device registry truth.
export class PdaDeviceController {
  constructor(
    private readonly heartbeatUseCase: PdaDeviceHeartbeatUseCase,
    private readonly logsUseCase: PdaDeviceLogsUseCase
  ) {}

  @Post('heartbeat')
  @Public()
  @ApiOperation({ summary: 'Record the latest PDA device heartbeat diagnostic state' })
  @ApiBody({ type: PdaHeartbeatDto })
  @ApiResponse({ status: 201, type: PdaHeartbeatViewModel })
  heartbeat(@Body() dto: PdaHeartbeatDto): PdaHeartbeatViewModel {
    return this.heartbeatUseCase.execute(dto)
  }

  @Post('logs')
  @Public()
  @ApiOperation({ summary: 'Accept manually uploaded PDA diagnostic logs' })
  @ApiBody({ type: PdaDeviceLogsDto })
  @ApiResponse({ status: 201, type: PdaDeviceLogsViewModel })
  logs(@Body() dto: PdaDeviceLogsDto): PdaDeviceLogsViewModel {
    return this.logsUseCase.execute(dto)
  }
}
