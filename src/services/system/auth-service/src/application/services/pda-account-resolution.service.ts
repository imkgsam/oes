import { Inject, Injectable } from '@nestjs/common'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  IdentityAccountSummary,
  IIdentityServicePort
} from '../ports/identity-service.port'
import {
  AccountTerminalAccessDecision,
  IPermissionServicePort
} from '../ports/permission-service.port'
import { AUTH_TERMINAL_ACCESS_DENIED } from '../../common/constants/exception-enums'

export interface ResolvePdaAccountInput {
  userId: string
  deviceBoundTenantId: string
}

export interface ResolvedPdaAccount {
  account: IdentityAccountSummary
  terminalAccess: AccountTerminalAccessDecision
}

// Resolves exactly one PDA-eligible tenant account for a user and managed device tenant binding.
@Injectable()
export class PdaAccountResolutionService {
  constructor(
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    @Inject(PERMISSION_SERVICE)
    private readonly permissionService: IPermissionServicePort
  ) {}

  // Applies identity account facts and permission terminal policy to choose one PDA login account.
  async resolve(input: ResolvePdaAccountInput): Promise<ResolvedPdaAccount> {
    const deviceBoundTenantId = input.deviceBoundTenantId.trim()
    const candidates = (await this.identityService.getAvailableAccountsByUserId(input.userId))
      .filter((account) => account.tenantId === deviceBoundTenantId)

    const decisions = await Promise.all(
      candidates.map(async (account) => ({
        account,
        decision: await this.permissionService.resolveAccountTerminalAccess({
          accountId: account.accountId,
          tenantId: account.tenantId,
          scopeLevel: account.scopeLevel,
          terminal: 'PDA'
        })
      }))
    )
    const allowedAccounts = decisions
      .filter(({ decision }) => decision.allowed)
      .map(({ account }) => account)

    if (allowedAccounts.length !== 1) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_ACCESS_DENIED, {
        reasonCode: 'PDA_ACCOUNT_RESOLUTION_FAILED',
        userId: input.userId,
        deviceBoundTenantId,
        candidateCount: candidates.length,
        allowedCandidateCount: allowedAccounts.length,
        terminal: 'PDA'
      })
    }

    const account = await this.identityService.getAccountById(allowedAccounts[0].accountId)
    if (
      !account ||
      account.userId !== input.userId ||
      !account.isEnabled ||
      account.tenantId !== deviceBoundTenantId
    ) {
      throw ExceptionFactory.domain(AUTH_TERMINAL_ACCESS_DENIED, {
        reasonCode: 'PDA_ACCOUNT_RESOLUTION_FAILED',
        userId: input.userId,
        deviceBoundTenantId,
        accountId: allowedAccounts[0].accountId,
        terminal: 'PDA'
      })
    }

    return {
      account,
      terminalAccess: decisions.find(({ account: item }) => item.accountId === account.accountId)!
        .decision
    }
  }
}
