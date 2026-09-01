import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { AccountContactAssetRepository } from '../../../domain/repositories/account-contact-asset.repository'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { EmployeeBindingRepository } from '../../../domain/repositories/employee-binding.repository'
import { PublicBusinessCardIdentityView } from './contact-query.result'
import { resolveContactActionTargets } from './resolve-contact-action-targets.handler'
import { ResolvePublicBusinessCardIdentityQuery } from './resolve-public-business-card-identity.query'

/** Resolves the minimum same-tenant account and public-safe contacts for Public Entry. */
@QueryHandler(ResolvePublicBusinessCardIdentityQuery)
export class ResolvePublicBusinessCardIdentityHandler implements IQueryHandler<
  ResolvePublicBusinessCardIdentityQuery,
  PublicBusinessCardIdentityView
> {
  constructor(
    @Inject(SYMBOLS.REPO.EMPLOYEE_BINDING)
    private readonly employeeBindingRepository: EmployeeBindingRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.ACCOUNT_CONTACT_ASSET)
    private readonly accountContactAssetRepository: AccountContactAssetRepository
  ) {}

  async execute(
    query: ResolvePublicBusinessCardIdentityQuery
  ): Promise<PublicBusinessCardIdentityView> {
    const binding = await this.employeeBindingRepository.findByEmployeeId(query.employeeId)
    if (
      !binding ||
      binding.tenantId !== query.tenantId ||
      binding.employeeId !== query.employeeId
    ) {
      return unavailable('BINDING_UNAVAILABLE')
    }
    const account = await this.accountRepository.findById(binding.accountId)
    const displayName = account?.displayName?.trim() || ''
    if (
      !account ||
      account.scopeLevel !== 'TENANT' ||
      account.tenantId !== query.tenantId ||
      !account.isEnabled ||
      !displayName
    ) {
      return unavailable('ACCOUNT_UNAVAILABLE')
    }
    const contact = await resolveContactActionTargets(this.accountContactAssetRepository, {
      tenantId: query.tenantId,
      accountId: account.id,
      employeeId: query.employeeId,
      targetRefs: query.targetRefs
    })
    return {
      available: true,
      tenantId: query.tenantId,
      employeeId: query.employeeId,
      accountId: account.id,
      displayName,
      targets: contact.targets,
      reasonCode: ''
    }
  }
}

function unavailable(reasonCode: string): PublicBusinessCardIdentityView {
  return {
    available: false,
    tenantId: null,
    employeeId: null,
    accountId: null,
    displayName: null,
    targets: [],
    reasonCode
  }
}
