import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'

@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
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
  readiness() {
    // TODO: add downstream service connectivity checks
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString()
    }
  }
}
