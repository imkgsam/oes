import { Injectable } from '@nestjs/common'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { Role } from 'src/domain/aggregates/role.aggregate'
import { AccountType } from 'src/domain/enums/account-type.enum'
import { RoleRepository } from 'src/domain/repositories/role.repository'
import { PermissionMapper } from 'src/infrastructure/mappers/permission.mapper'
import { RoleMapper } from 'src/infrastructure/mappers/role.mapper'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

const ROLE_INCLUDE = {
  permissions: { include: { permission: true } }
} as const

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Role | null> {
    const found = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE
    })
    return found ? RoleMapper.toDomain(found) : null
  }

  async findByCode(code: string): Promise<Role | null> {
    const found = await this.prisma.role.findFirst({
      where: { code },
      include: ROLE_INCLUDE
    })
    return found ? RoleMapper.toDomain(found) : null
  }

  async findAll(): Promise<Role[]> {
    const records = await this.prisma.role.findMany({ include: ROLE_INCLUDE })
    return records.map(RoleMapper.toDomain)
  }

  async save(role: Role): Promise<Role> {
    const data = RoleMapper.toPersistent(role)

    // Upsert the role itself
    await this.prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: data.name,
        code: data.code,
        tenantId: data.tenantId,
        isSystem: data.isSystem,
        isEnabled: data.isEnabled,
        description: data.description
      },
      create: {
        ...data,
        createdBy: role.id // placeholder – actual createdBy is set at command level
      }
    })

    // Sync role-permission bindings: delete removed, create new
    const existingRPs = await this.prisma.rolePermission.findMany({
      where: { roleId: role.id }
    })
    const currentIds = new Set(role.permissions.map((p) => p.permissionId))
    const existingIds = new Set(existingRPs.map((rp) => rp.permissionId))

    // Delete removed
    const toDelete = existingRPs.filter((rp) => !currentIds.has(rp.permissionId))
    if (toDelete.length > 0) {
      await this.prisma.rolePermission.deleteMany({
        where: { id: { in: toDelete.map((rp) => rp.id) } }
      })
    }

    // Create new
    const toCreate = role.permissions.filter((p) => !existingIds.has(p.permissionId))
    if (toCreate.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: toCreate.map((p) => ({
          roleId: role.id,
          permissionId: p.permissionId,
          createdBy: role.id // placeholder
        }))
      })
    }

    return (await this.findById(role.id))!
  }

  async delete(id: string): Promise<Role | null> {
    // Delete role-permission bindings first
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } })
    await this.prisma.accountRole.deleteMany({ where: { roleId: id } })
    const deleted = await this.prisma.role.delete({ where: { id } })
    return deleted ? RoleMapper.toDomain(deleted) : null
  }

  async findOwnPermissions(roleId: string): Promise<Permission[]> {
    const rps = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }
    })
    return rps.map((rp) => PermissionMapper.toDomain(rp.permission))
  }

  async findRolesForAccountId(accountId: string): Promise<Role[]> {
    const accountRoles = await this.prisma.accountRole.findMany({
      where: { accountId },
      include: { role: { include: ROLE_INCLUDE } }
    })
    return accountRoles.map((ar) => RoleMapper.toDomain(ar.role))
  }

  async assignAccountRole(
    accountId: string,
    roleId: string,
    tenantId: string,
    accountType: AccountType,
    createdBy: string
  ): Promise<void> {
    await this.prisma.accountRole.create({
      data: { accountId, roleId, tenantId, accountType, createdBy }
    })
  }

  async revokeAccountRole(accountId: string, roleId: string): Promise<void> {
    await this.prisma.accountRole.delete({
      where: { accountId_roleId: { accountId, roleId } }
    })
  }

  async findAccountRoles(accountId: string, tenantId: string): Promise<Role[]> {
    const accountRoles = await this.prisma.accountRole.findMany({
      where: { accountId, tenantId },
      include: { role: { include: ROLE_INCLUDE } }
    })
    return accountRoles.map((ar) => RoleMapper.toDomain(ar.role))
  }
}
