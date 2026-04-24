import { Inject, Injectable, Optional } from '@nestjs/common'

export interface AccountDeletionBlockingReason {
  resourceType: string
  resourceCount: number
  message: string
}

export interface AccountDeletionBlockerChecker {
  getBlockingReasons(input: {
    accountId: string
    userId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
  }): Promise<AccountDeletionBlockingReason[]>
}

export const ACCOUNT_DELETION_BLOCKER_CHECKERS = Symbol(
  'IDENTITY_ACCOUNT_DELETION_BLOCKER_CHECKERS'
)

@Injectable()
// Aggregates account-deletion blockers from business-aware checkers without coupling to one domain.
export class AccountDeletionBlockerService {
  constructor(
    @Optional()
    @Inject(ACCOUNT_DELETION_BLOCKER_CHECKERS)
    private readonly checkers: AccountDeletionBlockerChecker[] = []
  ) {}

  async getBlockingReasons(input: {
    accountId: string
    userId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
  }): Promise<AccountDeletionBlockingReason[]> {
    const results = await Promise.all(
      this.checkers.map((checker) => checker.getBlockingReasons(input))
    )

    return results.flat()
  }
}
