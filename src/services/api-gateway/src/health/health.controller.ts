import { Controller, Get, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'
import type { Response } from 'express'
import { GatewayReadinessService } from './gateway-readiness.service'

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly readinessService: GatewayReadinessService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness(@Res({ passthrough: true }) response: Response) {
    const result = await this.readinessService.check()
    response.status(result.ready ? 200 : 503)
    return result
  }
}
