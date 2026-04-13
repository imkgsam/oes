import { Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { PermissionAccessSummaryGrpcAdapter } from '../../infrastructure/downstream/permission-service/permission-access-summary-grpc.adapter'
import { SessionAccessSummaryViewModel } from '../../interfaces/http/view-models/session-access-summary.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Resolves the authenticated account's effective roles and action codes for front-end access gating.
export class SessionAccessSummaryUseCase {
  constructor(private readonly permissionAdapter: PermissionAccessSummaryGrpcAdapter) {}

  async execute(source: DownstreamRequestSource): Promise<SessionAccessSummaryViewModel> {
    const self = getAuthenticatedSelfContext(source)

    if (!self.accountId) {
      throw new UnauthorizedException('authenticated session access summary is missing account id')
    }

    if (self.scopeLevel === 'TENANT' && !self.tenantId) {
      throw new UnauthorizedException('tenant session access summary is missing tenant id')
    }

    const summary = await this.permissionAdapter.getAccountAccessSummary(
      {
        accountId: self.accountId,
        tenantId: self.tenantId,
        scopeLevel: self.scopeLevel
      },
      source
    )

    return {
      roles: (summary.roles ?? []).map((role) => ({
        roleId: role.roleId ?? '',
        code: role.code ?? '',
        name: role.name ?? '',
        tenantId: role.tenantId ?? '',
        scope: role.scope ?? ''
      })),
      actionCodes: summary.actionCodes ?? []
    }
  }
}
