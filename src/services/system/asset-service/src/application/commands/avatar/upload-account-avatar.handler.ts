import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ExceptionFactory } from '@oes/common/exceptions'
import { createHash } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetEntity } from '../../../domain/entities/asset.entity'
import { ObjectStoragePort } from '../../../domain/ports/object-storage.port'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { UploadAccountAvatarCommand } from './upload-account-avatar.command'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

@Injectable()
@CommandHandler(UploadAccountAvatarCommand)
// UploadAccountAvatarHandler validates one avatar file and persists the pending asset metadata plus storage mapping.
export class UploadAccountAvatarHandler implements ICommandHandler<UploadAccountAvatarCommand, AssetEntity> {
  constructor(
    @Inject(SYMBOLS.REPO.ASSET)
    private readonly assetRepository: AssetRepository,
    @Inject(SYMBOLS.PORT.OBJECT_STORAGE)
    private readonly objectStoragePort: ObjectStoragePort
  ) {}

  async execute(command: UploadAccountAvatarCommand): Promise<AssetEntity> {
    validateScopeOwnership(command.scopeLevel, command.tenantId)

    if (!ALLOWED_MIME_TYPES.has(command.contentType)) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: [`contentType: unsupported avatar content type ${command.contentType}`]
      })
    }

    if (!command.file?.length) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: ['file: avatar file is required']
      })
    }

    if (command.file.length > MAX_AVATAR_SIZE_BYTES) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: [`file: avatar file exceeds ${MAX_AVATAR_SIZE_BYTES} bytes`]
      })
    }

    const checksum = createHash('sha256').update(command.file).digest('hex')
    const storage = await this.objectStoragePort.putObject({
      body: command.file,
      contentType: command.contentType,
      fileName: command.fileName,
      ownerAccountId: command.accountId,
      scopeLevel: command.scopeLevel,
      tenantId: command.tenantId
    })

    return this.assetRepository.create({
      scopeLevel: command.scopeLevel,
      tenantId: command.tenantId,
      ownerAccountId: command.accountId,
      category: 'ACCOUNT_AVATAR',
      storageKey: storage.storageKey,
      mimeType: command.contentType,
      size: BigInt(command.file.length),
      checksum,
      publicUrl: storage.publicUrl,
      status: 'PENDING_BIND',
      createdBy: command.operatorId
    })
  }
}

function validateScopeOwnership(scopeLevel: 'SYSTEM' | 'TENANT', tenantId?: string): void {
  if (scopeLevel === 'TENANT' && !tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: tenant-scoped avatar assets require tenantId']
    })
  }

  if (scopeLevel === 'SYSTEM' && tenantId) {
    throw ExceptionFactory.application(VALIDATION_FAILED, {
      violations: ['tenantId: system-scoped avatar assets must not carry tenantId']
    })
  }
}
