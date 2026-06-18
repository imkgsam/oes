import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { createHash } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetEntity } from '../../../domain/entities/asset.entity'
import { ObjectStoragePort } from '../../../domain/ports/object-storage.port'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { validateAccountAvatarScope, validateAvatarFile } from './avatar-command-validation'
import { UploadAccountAvatarCommand } from './upload-account-avatar.command'

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
    validateAccountAvatarScope(command.scopeLevel, command.tenantId)
    validateAvatarFile(command)

    const checksum = createHash('sha256').update(command.file).digest('hex')
    const storage = await this.objectStoragePort.putObject({
      body: command.file,
      category: 'ACCOUNT_AVATAR',
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
