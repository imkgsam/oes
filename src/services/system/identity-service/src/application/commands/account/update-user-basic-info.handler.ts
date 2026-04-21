import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory, VALIDATION_FAILED } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import {
  IDENTITY_ACCOUNT_NOT_FOUND,
  IDENTITY_USER_NOT_FOUND,
  SYMBOLS
} from '../../../common/constants'
import { UserSummaryEntity } from '../../../domain/entities/user-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { UpdateUserBasicInfoCommand } from './update-user-basic-info.command'

@CommandHandler(UpdateUserBasicInfoCommand)
// Updates one account-bound user's contact fields after tenant-boundary and uniqueness checks pass.
export class UpdateUserBasicInfoHandler
  implements ICommandHandler<UpdateUserBasicInfoCommand, UserSummaryEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    @Inject(SYMBOLS.REPO.USER)
    private readonly userRepository: UserRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: UpdateUserBasicInfoCommand): Promise<UserSummaryEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    if (account.userId !== command.userId) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        field: 'userId',
        value: command.userId
      })
    }

    if (account.tenantId) {
      this.checkResourceService.checkAccount(command.operatorScope, {
        resourceId: account.id,
        tenantId: account.tenantId
      })
    }

    const user = await this.userRepository.findById(command.userId)
    if (!user) {
      throw ExceptionFactory.domain(IDENTITY_USER_NOT_FOUND, {
        userId: command.userId
      })
    }

    const email = normalizeOptional(command.email)?.toLowerCase()
    const phone = normalizeOptional(command.phone)

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

    if (email) {
      const existing = await this.userRepository.findByEmail(email)
      if (existing && existing.id !== command.userId) {
        throw ExceptionFactory.application(VALIDATION_FAILED, {
          field: 'email',
          value: email
        })
      }
    }

    if (phone) {
      const existing = await this.userRepository.findByPhone(phone)
      if (existing && existing.id !== command.userId) {
        throw ExceptionFactory.application(VALIDATION_FAILED, {
          field: 'phone',
          value: phone
        })
      }
    }

    return this.userRepository.updateBasicInfo(command.userId, {
      email,
      phone
    })
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

// Keeps edited login phones aligned with the canonical phone format emitted by the web login flow.
function isCanonicalLoginPhone(phone: string): boolean {
  return /^\+[1-9]\d{5,19}$/.test(phone)
}
