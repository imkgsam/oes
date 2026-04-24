import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AssetGrpcAdapter } from '../../infrastructure/downstream/asset-service/asset-grpc.adapter'
import { IdentityQueryGrpcAdapter } from '../../infrastructure/downstream/identity-service/identity-query-grpc.adapter'
import { AccountProfileDto } from '../../interfaces/http/dtos/account-profile.dto'
import {
  AccountProfileMutationViewModel
} from '../../interfaces/http/view-models/personal-center.view-model'
import {
  PERSONAL_CENTER_SUMMARY_PORT,
  PersonalCenterSummaryPort
} from '../ports/personal-center-summary.port'
import { getAuthenticatedSelfContext } from './self-security-context'
import { SessionAccessSummaryUseCase } from './session-access-summary.use-case'
import { SessionContextUseCase } from './session-context.use-case'

@Injectable()
// Updates only the authenticated current-account profile fields and returns the refreshed account context view.
export class AccountProfileUseCase {
  constructor(
    private readonly sessionContextUseCase: SessionContextUseCase,
    private readonly sessionAccessSummaryUseCase: SessionAccessSummaryUseCase,
    private readonly identityAdapter: IdentityQueryGrpcAdapter,
    private readonly assetAdapter: AssetGrpcAdapter,
    @Inject(PERSONAL_CENTER_SUMMARY_PORT)
    private readonly identitySummaryPort: PersonalCenterSummaryPort
  ) {}

  async execute(
    dto: AccountProfileDto,
    source: DownstreamRequestSource
  ): Promise<AccountProfileMutationViewModel> {
    const self = getAuthenticatedSelfContext(source)

    if (!self.accountId) {
      throw new UnauthorizedException('authenticated session context is missing current account id')
    }

    const [updatedAccountResult, sessionContext, accessSummary, identitySummary] = await Promise.all([
      this.identityAdapter.updateOwnAccountProfile(
        {
          accountId: self.accountId,
          avatarAssetId: dto.avatarAssetId,
          displayName: dto.displayName,
          bio: dto.bio
        },
        source
      ),
      this.sessionContextUseCase.execute(source),
      this.sessionAccessSummaryUseCase.execute(source),
      this.identitySummaryPort.getPersonalCenterSummary(self.userId, self.accountId, source)
    ])

    const boundAvatar =
      dto.avatarAssetId
        ? await this.assetAdapter.bindAccountAvatar(
            {
              accountId: self.accountId,
              newAssetId: dto.avatarAssetId,
              operatorId: self.accountId,
              scopeLevel: self.scopeLevel,
              tenantId: self.tenantId
            },
            source
          )
        : undefined

    return {
      accountContext: {
        accountId: sessionContext.account?.accountId ?? self.accountId,
        accountName: sessionContext.account?.name,
        avatar: normalize(boundAvatar?.activeAsset?.publicUrl) ?? normalize(updatedAccountResult.account?.avatarUrl),
        displayName: normalize(updatedAccountResult.account?.displayName),
        bio: normalize(updatedAccountResult.account?.bio),
        tenantId: sessionContext.tenant?.tenantId,
        tenantName: sessionContext.tenant?.name,
        scopeLevel: sessionContext.scopeLevel,
        roles: accessSummary.roles ?? [],
        workEmail: identitySummary.workEmail,
        workPhone: identitySummary.workPhone
      }
    }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
