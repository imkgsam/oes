import { Injectable } from '@nestjs/common'
import { RolePermission } from 'src/domain/entities/role-permission.entity'
import { RolePermissionRepository } from 'src/domain/repositories/role-permission.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaRolePermissionRepository implements RolePermissionRepository {
  constructor(private readonly prisma: PrismaService) { }
  async findByRoleIds(roleIds: string[]): Promise<RolePermission[]> {
    const founds = await this.prisma.rolePermission.findMany({ where: { roleId: { in: roleIds } }, include: { permission: true } })
    return founds.map((r) => RolePermission.fromPrisma(r))
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    const records = await this.prisma.rolePermission.findMany({ where: { roleId } })
    return records.map((r) => RolePermission.fromPrisma(r))
  }

  async find(roleId: string, permissionId: string): Promise<RolePermission | null> {
    const found = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    })
    return found ? RolePermission.fromPrisma(found) : null
  }

  async add(rolePermission: RolePermission): Promise<RolePermission> {
    const created = await this.prisma.rolePermission.create({
      data: {
        roleId: rolePermission.roleId,
        permissionId: rolePermission.permissionId,
      }
    })
    return RolePermission.fromPrisma(created)
  }

  async remove(roleId: string, permissionId: string): Promise<RolePermission | null> {
    const deleted = await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    })
    return deleted ? RolePermission.fromPrisma(deleted) : null
  }
}
