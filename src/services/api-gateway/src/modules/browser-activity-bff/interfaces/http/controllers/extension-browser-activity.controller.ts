import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { BrowserActivityBffService } from '../../../browser-activity-bff.service'
import {
  AppendBrowserActivityVisitSessionsDto,
  BrowserActivityHeartbeatDto
} from '../dtos/browser-activity.dto'

@ApiBearerAuth('JWT')
@ApiTags('extension-browser-activity')
@Controller('extension/browser-activity')
// ExtensionBrowserActivityController exposes browser-extension activity ingest endpoints.
export class ExtensionBrowserActivityController {
  constructor(private readonly browserActivityBffService: BrowserActivityBffService) {}

  @Get('audit-control')
  @ApiOperation({ summary: 'Read authenticated extension browser activity control state' })
  async getAuditControl(@DownstreamSource() source: DownstreamRequestSource) {
    return this.browserActivityBffService.getAuditControl({}, source)
  }

  @Post('visit-sessions')
  @ApiOperation({ summary: 'Append authenticated extension browser visit summaries' })
  async appendVisitSessions(
    @Body() body: AppendBrowserActivityVisitSessionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.appendVisitSessions(body, source)
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Record authenticated extension browser activity heartbeat' })
  async heartbeat(
    @Body() body: BrowserActivityHeartbeatDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.heartbeat(body, source)
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Mark authenticated extension browser activity session offline' })
  async disconnect(
    @Body() body: BrowserActivityHeartbeatDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.browserActivityBffService.disconnect(body, source)
  }
}
