import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CheckResourceService } from '../../authorization'
import { IDENTITY_ACCOUNT_NOT_FOUND, SYMBOLS } from '../../../common/constants'
import { AccountSummaryEntity } from '../../../domain/entities/account-summary.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { UpdateAccountProfileCommand } from './update-account-profile.command'

@CommandHandler(UpdateAccountProfileCommand)
export class UpdateAccountProfileHandler
  implements ICommandHandler<UpdateAccountProfileCommand, AccountSummaryEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(command: UpdateAccountProfileCommand): Promise<AccountSummaryEntity> {
    const account = await this.accountRepository.findById(command.accountId)
    if (!account) {
      throw ExceptionFactory.domain(IDENTITY_ACCOUNT_NOT_FOUND, {
        accountId: command.accountId
      })
    }

    if (account.tenantId) {
      this.checkResourceService.checkAccount(command.operatorScope, {
        resourceId: account.id,
        tenantId: account.tenantId
      })
    }

    return this.accountRepository.updateProfile(command.accountId, {
      avatarAssetId: normalizeOptionalText(command.avatarAssetId, 64),
      displayName: normalizeOptionalText(command.displayName, 64),
      bio: normalizeOptionalText(command.bio, 280),
      isEnabled: command.isEnabled
    })
  }
}

function normalizeOptionalText(value: string | undefined, maxLength: number): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  return normalized.slice(0, maxLength)
}
