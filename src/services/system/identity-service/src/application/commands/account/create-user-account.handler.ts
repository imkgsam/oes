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

@CommandHandler(CreateUserAccountCommand)
export class CreateUserAccountHandler
  implements ICommandHandler<CreateUserAccountCommand, AccountSummaryEntity>
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

  async execute(command: CreateUserAccountCommand): Promise<AccountSummaryEntity> {
    const email = normalizeOptional(command.email)?.toLowerCase()
    const phone = normalizeOptional(command.phone)
    const username = normalizeOptional(command.username)
    const displayName = normalizeOptional(command.displayName)

    if (!email && !phone) {
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

    if (email && (await this.userRepository.findByEmail(email))) {
      throw ExceptionFactory.application(VALIDATION_FAILED, { field: 'email', value: email })
    }

    if (phone && (await this.userRepository.findByPhone(phone))) {
      throw ExceptionFactory.application(VALIDATION_FAILED, { field: 'phone', value: phone })
    }

    const registeredParty = await this.partyRegistrationPort.registerPersonParty({
      canonicalName: displayName ?? username ?? email ?? phone ?? command.operatorId ?? 'Unnamed User',
      localDisplayName: displayName,
      operatorId: command.operatorId,
      operatorScope: command.operatorScope,
      tenantId
    })

    const user = await this.userRepository.create({
      partyId: registeredParty.partyId,
      username,
      email,
      phone,
      isActive: true
    })

    return this.accountRepository.createUserAccount({
      displayName,
      scopeLevel: command.scopeLevel,
      tenantId,
      userId: user.id
    })
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// Keeps newly created login phones aligned with the canonical phone format emitted by the web login flow.
function isCanonicalLoginPhone(phone: string): boolean {
  return /^\+[1-9]\d{5,19}$/.test(phone)
}
