import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetEntity } from '../../../domain/entities/asset.entity'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { BindAccountAvatarCommand } from './bind-account-avatar.command'

export interface BindAccountAvatarResult {
  activeAsset: AssetEntity
  replacedAssetId: null | string
}

@Injectable()
@CommandHandler(BindAccountAvatarCommand)
// BindAccountAvatarHandler promotes a pending avatar to active state and retires the previous active avatar.
export class BindAccountAvatarHandler
  implements ICommandHandler<BindAccountAvatarCommand, BindAccountAvatarResult>
{
  constructor(
    @Inject(SYMBOLS.REPO.ASSET)
    private readonly assetRepository: AssetRepository
  ) {}

  async execute(command: BindAccountAvatarCommand): Promise<BindAccountAvatarResult> {
    validateScopeOwnership(command.scopeLevel, command.tenantId)

    const nextAsset = await this.assetRepository.findById(command.newAssetId)
    if (
      !nextAsset ||
      nextAsset.scopeLevel !== command.scopeLevel ||
      nextAsset.tenantId !== (command.tenantId ?? null) ||
      nextAsset.ownerAccountId !== command.accountId
    ) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: ['newAssetId: avatar asset does not belong to the current account context']
      })
    }

    const activeAsset = await this.assetRepository.updateStatus({
      assetId: nextAsset.id,
      status: 'ACTIVE',
      updatedBy: command.operatorId
    })

    const previousAsset =
      command.previousAssetId
        ? await this.assetRepository.findById(command.previousAssetId)
        : await this.assetRepository.findActiveAvatarByAccountId(
            command.accountId,
            command.scopeLevel,
            command.tenantId
          )

    if (
      previousAsset &&
      previousAsset.id !== activeAsset.id &&
      previousAsset.ownerAccountId === command.accountId &&
      previousAsset.scopeLevel === command.scopeLevel &&
      previousAsset.tenantId === (command.tenantId ?? null)
    ) {
      await this.assetRepository.updateStatus({
        assetId: previousAsset.id,
        status: 'REPLACED',
        updatedBy: command.operatorId
      })

      return {
        activeAsset,
        replacedAssetId: previousAsset.id
      }
    }

    return {
      activeAsset,
      replacedAssetId: null
    }
  }
}

function validateScopeOwnership(scopeLevel: 'SYSTEM' | 'TENANT', tenantId?: string): void {
  if (scopeLevel === 'TENANT' && !tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: tenant-scoped avatar bindings require tenantId']
    })
  }

  if (scopeLevel === 'SYSTEM' && tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: system-scoped avatar bindings must not carry tenantId']
    })
  }
}
