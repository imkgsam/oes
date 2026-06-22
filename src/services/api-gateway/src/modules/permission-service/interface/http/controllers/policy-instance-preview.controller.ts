import { Body, Controller, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PERMISSION_MANAGEMENT_PERMISSION_CODES,
  RequirePermissions
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PermissionProxyService } from '../../../permission-service.service'
import { EvaluatePolicyInstancePreviewDto } from '../dtos/policy-instance-preview.dto'

/** PolicyInstancePreviewController exposes the first preview-only PolicyInstance testing entry. */
@ApiBearerAuth('JWT')
@ApiTags('policy-instance-preview')
@Controller('policy-instance')
export class PolicyInstancePreviewController {
  constructor(private readonly permissionService: PermissionProxyService) {}

  @Post('evaluate-preview')
  @RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })
  @ApiOperation({ summary: 'Evaluate a preview-only PolicyInstance request' })
  async evaluatePreview(
    @Body() body: EvaluatePolicyInstancePreviewDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.permissionService.evaluatePolicyInstancePreview(body, source)
  }
}
