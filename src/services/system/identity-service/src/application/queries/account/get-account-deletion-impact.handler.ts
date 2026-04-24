import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import { IDENTITY_ACCOUNT_NOT_FOUND, SYMBOLS } from '../../../common/constants'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountDeletionBlockerService } from '../../services/account-deletion-blocker.service'
import { AccountDeletionImpactView } from './account-query.result'
import { GetAccountDeletionImpactQuery } from './get-account-deletion-impact.query'

@QueryHandler(GetAccountDeletionImpactQuery)
// Builds the account-deletion impact preview that powers delete confirmation and blocker feedback.
export class GetAccountDeletionImpactHandler
  implements IQueryHandler<GetAccountDeletionImpactQuery, AccountDeletionImpactView>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly accountDeletionBlockerService: AccountDeletionBlockerService,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetAccountDeletionImpactQuery): Promise<AccountDeletionImpactView> {
    const result = await this.accountRepository.getDeletionImpact(query.accountId)
    if (!result.account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: query.accountId
      })
    }

    if (result.account.tenantId) {
      this.checkResourceService.checkAccount(query.operatorScope, {
        resourceId: result.account.id,
        tenantId: result.account.tenantId
      })
    }

    const blockingReasons = [
      ...result.blockingReasons,
      ...(await this.accountDeletionBlockerService.getBlockingReasons({
        accountId: result.account.id,
        userId: result.account.userId,
        tenantId: result.account.tenantId,
        scopeLevel: result.account.scopeLevel
      }))
    ]

    return {
      accountId: result.account.id,
      canDelete: blockingReasons.length === 0,
      userRetained: true,
      cleanupPlan: {
        willDeleteSessions: true,
        willClearRoles: true,
        willDeleteOrgMemberships: result.orgMembershipCount > 0,
        willDeleteContactAssets: result.contactAssetCount > 0
      },
      blockingReasons,
      orgMembershipCount: result.orgMembershipCount,
      contactAssetCount: result.contactAssetCount
    }
  }
}
