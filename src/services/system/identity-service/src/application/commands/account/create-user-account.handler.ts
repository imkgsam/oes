import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ACCESS_DENIED, ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import { PARTY_REGISTRATION_PORT, PartyRegistrationPort } from '../../ports/party-registration.port'
import { SYMBOLS } from '../../../common/constants'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { CreateUserAccountCommand } from './create-user-account.command'

export type CreateUserAccountResult = AccountSummaryEntity & {
  tenantPartyId?: string | null
}

/** CreateUserAccountHandler creates human accounts while preserving tenant-scoped party ownership semantics. */
@CommandHandler(CreateUserAccountCommand)
export class CreateUserAccountHandler
  implements ICommandHandler<CreateUserAccountCommand, CreateUserAccountResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository,
    private readonly checkResourceService: CheckResourceService,
    @Inject(PARTY_REGISTRATION_PORT)
    private readonly partyRegistrationPort: PartyRegistrationPort
  ) {}

  async execute(command: CreateUserAccountCommand): Promise<CreateUserAccountResult> {
    const email = normalizeOptional(command.email)?.toLowerCase()
    const phone = normalizeOptional(command.phone)
    const username = normalizeOptional(command.username)
    const displayName = normalizeOptional(command.displayName)
    const existingUserId = normalizeOptional(command.existingUserId)
    const tenantPartyId = normalizeOptional(command.tenantPartyId)

    if (!existingUserId && !email && !phone) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'email|phone'
      })
    }

    if (phone && !isCanonicalLoginPhone(phone)) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'phone',
        value: phone
      })
    }

    if (command.scopeLevel === 'TENANT' && !normalizeOptional(command.tenantId)) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'tenantId'
      })
    }

    if (tenantPartyId && command.scopeLevel !== 'TENANT') {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'tenantPartyId'
      })
    }

    if (command.operatorScope && !command.operatorScope.isSystemScope && command.scopeLevel === 'SYSTEM') {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        reason: 'tenant operator cannot create system accounts'
      })
    }

    const tenantId =
      command.scopeLevel === 'TENANT'
        ? normalizeOptional(command.tenantId) ?? command.operatorScope?.tenantId
        : undefined

    if (command.scopeLevel === 'TENANT' && tenantId) {
      this.checkResourceService.checkTenant(command.operatorScope, {
        resourceId: tenantId,
        tenantId
      })
    }

    if (existingUserId) {
      return this.createAccountForExistingUser({
        displayName,
        existingUserId,
        idempotencyKey: command.idempotencyKey,
        operatorId: command.operatorId,
        operatorScope: command.operatorScope,
        scopeLevel: command.scopeLevel,
        tenantId,
        tenantPartyId
      })
    }

    if (email && (await this.userRepository.findByEmail(email))) {
      throw ExceptionFactory.application(VALIDATION_FAILED, { field: 'email', value: email })
    }

    if (phone && (await this.userRepository.findByPhone(phone))) {
      throw ExceptionFactory.application(VALIDATION_FAILED, { field: 'phone', value: phone })
    }

    const registeredParty =
      command.scopeLevel === 'TENANT' && tenantId && !tenantPartyId
        ? await this.partyRegistrationPort.registerTenantParty({
            legalName: displayName ?? username ?? email ?? phone ?? command.operatorId ?? 'Unnamed User',
            displayName,
            idempotencyKey: command.idempotencyKey,
            operatorId: command.operatorId,
            operatorScope: command.operatorScope,
            tenantId
          })
        : undefined

    const user = await this.userRepository.create({
      username,
      email,
      phone,
      isActive: true
    })

    const account = await this.accountRepository.createUserAccount({
      displayName,
      scopeLevel: command.scopeLevel,
      tenantId,
      tenantPartyId: tenantPartyId ?? registeredParty?.tenantPartyId,
      userId: user.id
    })

    return Object.assign(account, {
      tenantPartyId: account.tenantPartyId
    })
  }

  /** createAccountForExistingUser binds a known user into one tenant account context with a tenant-local party subject. */
  private async createAccountForExistingUser(input: {
    displayName?: string
    existingUserId: string
    idempotencyKey?: string
    operatorId?: string
    operatorScope?: CreateUserAccountCommand['operatorScope']
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    tenantPartyId?: string
  }): Promise<CreateUserAccountResult> {
    if (input.scopeLevel !== 'TENANT' || !input.tenantId) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'tenantId'
      })
    }

    const user = await this.userRepository.findById(input.existingUserId)
    if (!user) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'existingUserId',
        value: input.existingUserId
      })
    }
    if (!user.isActive) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'existingUserId.isActive',
        value: input.existingUserId
      })
    }
    const tenantPartyId =
      input.tenantPartyId ??
      (
        await this.partyRegistrationPort.registerTenantParty({
          tenantId: input.tenantId,
          legalName:
            input.displayName ?? user.username ?? user.personalEmail ?? user.personalPhone ?? input.existingUserId,
          displayName: input.displayName,
          idempotencyKey: input.idempotencyKey,
          operatorId: input.operatorId,
          operatorScope: input.operatorScope
        })
      ).tenantPartyId
    const existingAccount = await this.accountRepository.findByUserScope({
      scopeLevel: 'TENANT',
      tenantId: input.tenantId,
      userId: input.existingUserId
    })
    if (existingAccount) {
      if (input.tenantPartyId && existingAccount.tenantPartyId !== input.tenantPartyId) {
        throw ExceptionFactory.application(VALIDATION_FAILED, {
          field: 'tenantPartyId',
          value: input.tenantPartyId
        })
      }
      return Object.assign(existingAccount, {
        tenantPartyId: existingAccount.tenantPartyId
      })
    }

    const account = await this.accountRepository.createUserAccount({
      displayName: input.displayName,
      scopeLevel: 'TENANT',
      tenantId: input.tenantId,
      tenantPartyId,
      userId: input.existingUserId
    })

    return Object.assign(account, {
      tenantPartyId: account.tenantPartyId
    })
  }
}

/** normalizeOptional trims optional string command fields and treats blanks as omitted. */
function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// Keeps newly created login phones aligned with the canonical phone format emitted by the web login flow.
function isCanonicalLoginPhone(phone: string): boolean {
  return /^\+[1-9]\d{5,19}$/.test(phone)
}
