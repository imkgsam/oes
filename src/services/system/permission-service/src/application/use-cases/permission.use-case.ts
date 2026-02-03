import { Inject, Injectable } from '@nestjs/common'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { PermissionService } from '../services/permission.service'
import { Permission } from 'src/domain/aggregates/permission.aggregate'

@Injectable()
export class CreatePermissionUseCase {
  constructor(private readonly permissionService: PermissionService) {}
  async execute(dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(dto)
  }
}

@Injectable()
export class ListPermissionsUseCase {
  constructor(private readonly permissionService: PermissionService) {}
  async execute(): Promise<Permission[]> {
    return this.permissionService.getAllPermissions()
  }
}

@Injectable()
export class CheckUserPermissionUseCase {
  constructor() {}
  async execute(userId: string, permissionCode: string): Promise<boolean> {
    const roles = await this.userRoleRepo.findByUserId(userId)
    const roleIds = roles.map((r) => r.roleId)
    const permissions = await this.rolePermissionRepo.findByRoleIds(roleIds)
    return permissions.some((p) => p.permission?.code === permissionCode)
  }
}
