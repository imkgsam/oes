import { Controller, Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { GrpcRequestContextInterceptor } from '@oes/common/authorization'
import { AuthorizeInternalCall } from '@oes/common/authorization'
import { PermissionFoundationTrustedExecutionGuard } from '../../modules/authorization/permission-trusted-execution.module'
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

@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(PermissionFoundationTrustedExecutionGuard)
@PermissionAccessSummaryServiceControllerMethods()
// Exposes internal account access summaries for trusted service-to-service consumers.
export class PermissionAccessSummaryGrpcController
  implements PermissionAccessSummaryServiceController
{
  private readonly logger = new Logger(PermissionAccessSummaryGrpcController.name)

  constructor(private readonly queryBus: ValidatingQueryBus) {}

  @AuthorizeInternalCall({ all: ['permission.internal.account_access_summary.resolve'] })
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
  @AuthorizeInternalCall({ all: ['permission.internal.account_navigation.resolve'] })
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
