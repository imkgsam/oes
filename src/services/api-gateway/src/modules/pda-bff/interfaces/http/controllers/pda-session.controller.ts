import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PdaSessionBootstrapUseCase } from '../../../application/use-cases/pda-session-bootstrap.use-case'
import { PdaBootstrapViewModel } from '../view-models/pda-bootstrap.view-model'

@ApiTags('pda-session')
@Controller('pda/session')
// Exposes PDA terminal session initialization endpoints for the independent Android APK.
export class PdaSessionController {
  constructor(private readonly bootstrapUseCase: PdaSessionBootstrapUseCase) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Initialize the authenticated PDA terminal workbench' })
  @ApiResponse({ status: 200, type: PdaBootstrapViewModel })
  async bootstrap(
    @DownstreamSource() source: DownstreamRequestSource
  ): Promise<PdaBootstrapViewModel> {
    return this.bootstrapUseCase.execute(source)
  }
}
