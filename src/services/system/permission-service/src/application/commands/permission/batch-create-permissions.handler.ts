import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { SYMBOLS } from '../../../common/constants/symbols'
import { PERMISSION_BATCH_CREATE_CONFLICT } from '../../../common/constants/exception-enums'
import {
  BatchCreatePermissionItemInput,
  BatchCreatePermissionsCommand
} from './batch-create-permissions.command'

@CommandHandler(BatchCreatePermissionsCommand)
export class BatchCreatePermissionsHandler implements ICommandHandler<BatchCreatePermissionsCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}

  async execute(command: BatchCreatePermissionsCommand): Promise<Permission[]> {
    const duplicateCodes = this.findDuplicateCodes(command.permissions)
    if (duplicateCodes.length > 0) {
      throw ExceptionFactory.domain(PERMISSION_BATCH_CREATE_CONFLICT, {
        reason: 'request_duplicate_codes',
        duplicateCodes
      })
    }

    const existing = await this.permissionRepo.findByCodes(
      command.permissions.map((permission) => permission.code)
    )

    if (existing.length > 0) {
      throw ExceptionFactory.domain(PERMISSION_BATCH_CREATE_CONFLICT, {
        reason: 'existing_codes',
        existingCodes: existing.map((permission) => permission.code)
      })
    }

    const permissions = command.permissions.map(
      (item) => new Permission(crypto.randomUUID(), item.code, item.module, item.description)
    )

    return this.permissionRepo.createMany(permissions)
  }

  private findDuplicateCodes(items: BatchCreatePermissionItemInput[]): string[] {
    const normalized = items.map((item) => item.code.trim())
    const seen = new Set<string>()
    const duplicates = new Set<string>()

    for (const code of normalized) {
      if (seen.has(code)) {
        duplicates.add(code)
      } else {
        seen.add(code)
      }
    }

    return [...duplicates]
  }
}
