import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CRM_MANAGEMENT_PERMISSION_CODES, RequirePermissions } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { AdminCrmPerformanceService } from '../../../admin-crm-performance.service'
import { AdminCrmPerformanceOverviewDto } from '../dtos/admin-crm-performance.dto'

@ApiBearerAuth('JWT')
@ApiTags('admin-crm-performance')
@Controller('admin/crm/performance')
// Exposes the read-only admin CRM performance console facade without creating a new performance domain.
export class AdminCrmPerformanceController {
  constructor(private readonly adminCrmPerformanceService: AdminCrmPerformanceService) {}

  @Get('overview')
  @RequirePermissions({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
  @ApiOperation({ summary: 'Get one employee CRM performance overview for tenant-web admin' })
  async getOverview(
    @Query() query: AdminCrmPerformanceOverviewDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.adminCrmPerformanceService.getOverview(query, source)
  }
}
