import { Injectable } from '@nestjs/common'
import { CreatePermissionDto } from '../dtos/permission.dto'
import { PermissionService } from '../services/permission.service'
import { UserRoleRepository } from 'src/domain/repositories/user-role.repository'
import { RolePermissionRepository } from 'src/domain/repositories/role-permission.repository'
import { Permission } from 'src/domain/entities/permission.entity'

@Injectable()
export class CreatePermissionUseCase {
  constructor(private readonly permissionService: PermissionService) { }
  async execute(dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionService.create(dto)
  }
}


@Injectable()
export class CheckUserPermissionUseCase {
  constructor(
    private readonly userRoleRepo: UserRoleRepository,
    private readonly rolePermissionRepo: RolePermissionRepository,
  ) { }
  async execute(userId: string, permissionCode: string): Promise<boolean> {
    const roles = await this.userRoleRepo.findByUserId(userId)
    const roleIds = roles.map((r) => r.roleId)
    const permissions = await this.rolePermissionRepo.findByRoleIds(roleIds)
    return permissions.some((p) => p.permission?.code === permissionCode)
  }
}
