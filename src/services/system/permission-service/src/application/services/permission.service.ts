import { Inject, Injectable } from '@nestjs/common'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { SYMBOLS } from '../../common/constants/symbols/index'

@Injectable()
export class PermissionService {
  constructor(
    @Inject(SYMBOLS.REPO.PERMISSION)
    private readonly permissionRepo: PermissionRepository
  ) {}
  async createPermission(dto: CreatePermissionDto): Promise<Permission> {}
}
