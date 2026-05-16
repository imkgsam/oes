import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import { InternalServiceGuard } from '@oes/common/authorization'
import {
  PermissionTerminalAccessServiceController,
  PermissionTerminalAccessServiceControllerMethods,
  ResolveAccountTerminalAccessRequest,
  ResolveAccountTerminalAccessResponse
} from '@oes/common/generated/permission_service'
import { ResolveAccountTerminalAccessQuery } from '../../application/queries/terminal-access'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(InternalServiceGuard)
@PermissionTerminalAccessServiceControllerMethods()
// Exposes internal terminal access decisions for trusted auth-service runtime enforcement.
export class PermissionTerminalAccessGrpcController
  implements PermissionTerminalAccessServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async resolveAccountTerminalAccess(
    request: ResolveAccountTerminalAccessRequest,
    ...rest: any
  ): Promise<ResolveAccountTerminalAccessResponse> {
    const result = await this.queryBus.execute(
      new ResolveAccountTerminalAccessQuery(
        request.accountId!,
        request.tenantId || undefined,
        normalizeScopeLevel(request.scopeLevel),
        request.terminal || ''
      )
    )

    return {
      allowed: result.allowed,
      reasonCode: result.reasonCode,
      effectiveAllowedTerminals: result.effectiveAllowedTerminals,
      resolutionSource: result.resolutionSource,
      matchedRoleIds: result.matchedRoleIds
    }
  }
}

// Normalizes external scope-level strings while preserving tenant behavior for older callers.
function normalizeScopeLevel(scopeLevel?: string): ScopeLevel {
  return scopeLevel === ScopeLevel.SYSTEM ? ScopeLevel.SYSTEM : ScopeLevel.TENANT
}
