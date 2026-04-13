import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  AuthenticatedOperatorGuard,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import {
  AccountAccessSummaryResponse,
  GetAccountAccessSummaryRequest,
  PermissionAccessSummaryServiceController,
  PermissionAccessSummaryServiceControllerMethods
} from '@oes/common/generated/permission_service'
import { GetAccountAccessSummaryQuery } from '../../application/queries/access-summary'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'

@Controller()
@UseFilters(GrpcExceptionFilter)
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
@PermissionAccessSummaryServiceControllerMethods()
// Exposes internal self-context access summaries without using management permission checks.
export class PermissionAccessSummaryGrpcController
  implements PermissionAccessSummaryServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getAccountAccessSummary(
    request: GetAccountAccessSummaryRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AccountAccessSummaryResponse> {
    return this.queryBus.execute(
      new GetAccountAccessSummaryQuery(
        request.accountId!,
        request.tenantId || undefined,
        normalizeScopeLevel(request.scopeLevel)
      )
    )
  }
}

// Normalizes external scope-level strings while preserving tenant behavior for older callers.
function normalizeScopeLevel(scopeLevel?: string): ScopeLevel {
  return scopeLevel === ScopeLevel.SYSTEM ? ScopeLevel.SYSTEM : ScopeLevel.TENANT
}
