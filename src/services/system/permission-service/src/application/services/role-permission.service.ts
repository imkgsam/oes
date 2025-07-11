// application/services/role-permission.service.ts
import { Injectable } from '@nestjs/common'
import { AssignRolePermissionDto } from '../dtos/role-permission.dto'
import { RolePermissionRepository } from 'src/domain/repositories/role-permission.repository'
import { RolePermission } from 'src/domain/entities/role-permission.entity'

@Injectable()
export class RolePermissionService {
  constructor(private readonly rolePermissionRepo: RolePermissionRepository) {}

  async assign(dto: AssignRolePermissionDto): Promise<void> {
    const found = await this.rolePermissionRepo.find(dto.roleId, dto.permissionId)
    if (!found) {
      await this.rolePermissionRepo.add(new RolePermission(crypto.randomUUID(), found.roleId, found.permissionId))
    }
  }

  async revoke(dto: AssignRolePermissionDto): Promise<void> {
    await this.rolePermissionRepo.remove(dto.roleId, dto.permissionId)
  }
}
