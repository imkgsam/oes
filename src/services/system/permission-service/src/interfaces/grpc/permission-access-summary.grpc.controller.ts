import { Controller, Logger, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import {
  InternalServiceGuard
} from '@oes/common/authorization'
import {
  AccountAccessSummaryResponse,
  AccountNavigationSummaryResponse,
  GetAccountAccessSummaryRequest,
  PermissionAccessSummaryServiceController,
  PermissionAccessSummaryServiceControllerMethods,
  ResolveAccountNavigationRequest
} from '@oes/common/generated/permission_service'
import { GetAccountAccessSummaryQuery, ResolveAccountNavigationQuery } from '../../application/queries/access-summary'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(InternalServiceGuard)
@PermissionAccessSummaryServiceControllerMethods()
// Exposes internal account access summaries for trusted service-to-service consumers.
export class PermissionAccessSummaryGrpcController
  implements PermissionAccessSummaryServiceController
{
  private readonly logger = new Logger(PermissionAccessSummaryGrpcController.name)

  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getAccountAccessSummary(
    request: GetAccountAccessSummaryRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AccountAccessSummaryResponse> {
    this.logger.log(
      `getAccountAccessSummary request: accountId=${request.accountId ?? ''}; tenantId=${
        request.tenantId ?? ''
      }; scopeLevel=${request.scopeLevel ?? ''}`
    )
    return this.queryBus.execute(
      new GetAccountAccessSummaryQuery(
        request.accountId!,
        request.tenantId || undefined,
        normalizeScopeLevel(request.scopeLevel)
      )
    )
  }

  // Resolves runtime navigation for BFF session-context consumers without management permissions.
  async resolveAccountNavigation(
    request: ResolveAccountNavigationRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AccountNavigationSummaryResponse> {
    const result = await this.queryBus.execute(
      new ResolveAccountNavigationQuery(
        request.accountId!,
        request.tenantId || undefined,
        normalizeScopeLevel(request.scopeLevel),
        request.terminal || 'WEB'
      )
    )

    return {
      visibleEntries: result.visibleEntries,
      defaultEntry: result.defaultEntry,
      resolvedByRoleId: result.resolvedByRoleId ?? '',
      fallbackReason: result.fallbackReason ?? ''
    }
  }
}

// Normalizes external scope-level strings while preserving tenant behavior for older callers.
function normalizeScopeLevel(scopeLevel?: string): ScopeLevel {
  return scopeLevel === ScopeLevel.SYSTEM ? ScopeLevel.SYSTEM : ScopeLevel.TENANT
}
