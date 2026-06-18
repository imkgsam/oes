import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { createHash } from 'node:crypto'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetEntity } from '../../../domain/entities/asset.entity'
import { ObjectStoragePort } from '../../../domain/ports/object-storage.port'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { validateAvatarFile, validateEmployeeOfficialPhotoScope } from './avatar-command-validation'
import { UploadEmployeeOfficialPhotoCommand } from './upload-employee-official-photo.command'

@Injectable()
@CommandHandler(UploadEmployeeOfficialPhotoCommand)
// UploadEmployeeOfficialPhotoHandler validates and stores a pending tenant employee official photo asset.
export class UploadEmployeeOfficialPhotoHandler
  implements ICommandHandler<UploadEmployeeOfficialPhotoCommand, AssetEntity>
{
  constructor(
    @Inject(SYMBOLS.REPO.ASSET)
    private readonly assetRepository: AssetRepository,
    @Inject(SYMBOLS.PORT.OBJECT_STORAGE)
    private readonly objectStoragePort: ObjectStoragePort
  ) {}

  async execute(command: UploadEmployeeOfficialPhotoCommand): Promise<AssetEntity> {
    const tenantId = validateEmployeeOfficialPhotoScope(command)
    validateAvatarFile(command)

    const checksum = createHash('sha256').update(command.file).digest('hex')
    const storage = await this.objectStoragePort.putObject({
      body: command.file,
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
      contentType: command.contentType,
      fileName: command.fileName,
      ownerEmployeeId: command.employeeId,
      scopeLevel: 'TENANT',
      tenantId
    })

    return this.assetRepository.create({
      scopeLevel: 'TENANT',
      tenantId,
      ownerAccountId: null,
      ownerEmployeeId: command.employeeId,
      category: 'EMPLOYEE_OFFICIAL_PHOTO',
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
