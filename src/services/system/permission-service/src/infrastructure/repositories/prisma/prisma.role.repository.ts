import { Injectable, Logger } from '@nestjs/common'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { Role } from '../../../domain/aggregates/role.aggregate'
import { AccountType } from '../../../domain/enums/account-type.enum'
import { RoleKind } from '../../../domain/enums/role-kind.enum'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { AccountRole } from '../../../domain/vo/account-role.value-object'
import { Prisma } from '../../../../prisma/generated/prisma'
import { PermissionMapper } from '../../mappers/permission.mapper'
import { RoleMapper } from '../../mappers/role.mapper'
import { PrismaService } from '../../prisma/prisma.service'

const ROLE_INCLUDE = {
  permissions: { include: { permission: true } }
} as const

function buildActiveAccountRoleWhere(now: Date): Prisma.AccountRoleWhereInput {
  return {
    AND: [
      {
        OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }]
      },
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      }
    ]
  } as const
}

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  private readonly logger = new Logger(PrismaRoleRepository.name)

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

  async findByScopeAndCode(scopeKey: string, code: string): Promise<Role | null> {
    const found = await this.prisma.role.findFirst({
      where: { scopeKey, code },
      include: ROLE_INCLUDE
    })
    return found ? RoleMapper.toDomain(found) : null
  }

  async findByScopeKindAndCode(scopeKey: string, kind: RoleKind, code: string): Promise<Role | null> {
    const found = await this.prisma.role.findFirst({
      where: { scopeKey, kind, code },
      include: ROLE_INCLUDE
    })
    return found ? RoleMapper.toDomain(found) : null
  }

  async findAll(): Promise<Role[]> {
    const records = await this.prisma.role.findMany({ include: ROLE_INCLUDE })
    return records.map(RoleMapper.toDomain)
  }

  async findRoleInstances(query: {
    page: number
    pageSize: number
    tenantId?: string
    scopeLevel?: ScopeLevel
    keyword?: string
  }): Promise<{ roles: Role[]; total: number; page: number; pageSize: number }> {
    const page = query.page
    const pageSize = query.pageSize
    const skip = (page - 1) * pageSize
    const keyword = query.keyword?.trim()

    const where = {
      kind: query.scopeLevel
        ? query.scopeLevel === ScopeLevel.SYSTEM
          ? RoleKind.SYSTEM_INSTANCE
          : RoleKind.TENANT_INSTANCE
        : {
            in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE]
          },
      ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' as const } },
              { code: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: ROLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.role.count({ where })
    ])

    return {
      roles: records.map(RoleMapper.toDomain),
      total,
      page,
      pageSize
    }
  }

  async findRoleTemplates(query: {
    page: number
    pageSize: number
    keyword?: string
  }): Promise<{ roles: Role[]; total: number; page: number; pageSize: number }> {
    const page = query.page
    const pageSize = query.pageSize
    const skip = (page - 1) * pageSize
    const keyword = query.keyword?.trim()

    const where = {
      kind: RoleKind.SYSTEM_TEMPLATE,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' as const } },
              { code: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: ROLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.role.count({ where })
    ])

    return {
      roles: records.map(RoleMapper.toDomain),
      total,
      page,
      pageSize
    }
  }

  async save(role: Role): Promise<Role> {
    const data = RoleMapper.toPersistent(role)

    await this.prisma.$transaction(async (tx) => {
      await tx.role.upsert({
        where: { id: role.id },
        update: {
          name: data.name,
          code: data.code,
          tenantId: data.tenantId,
          scopeKey: data.scopeKey,
          kind: data.kind,
          templateRoleId: data.templateRoleId,
          isEnabled: data.isEnabled,
          description: data.description
        } as any,
        create: {
          ...data
        } as any
      })

      const existingRPs = await tx.rolePermission.findMany({
        where: { roleId: role.id }
      })
      const currentIds = new Set(role.permissions.map((p) => p.permissionId))
      const existingIds = new Set(existingRPs.map((rp) => rp.permissionId))

      const toDelete = existingRPs.filter((rp) => !currentIds.has(rp.permissionId))
      if (toDelete.length > 0) {
        await tx.rolePermission.deleteMany({
          where: { id: { in: toDelete.map((rp) => rp.id) } }
        })
      }

      const toCreate = role.permissions.filter((p) => !existingIds.has(p.permissionId))
      if (toCreate.length > 0) {
        await tx.rolePermission.createMany({
          data: toCreate.map((p) => ({
            roleId: role.id,
            permissionId: p.permissionId
          }))
        })
      }
    })

    return (await this.findById(role.id))!
  }

  async delete(id: string): Promise<Role | null> {
    const deleted = await this.prisma.role.delete({ where: { id } })
    return deleted ? RoleMapper.toDomain(deleted) : null
  }

  async hasAssignedAccounts(roleId: string): Promise<boolean> {
    const count = await this.prisma.accountRole.count({ where: { roleId } })
    return count > 0
  }

  async hasAssignedPermissions(roleId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({ where: { roleId } })
    return count > 0
  }

  async hasTemplateInstances(roleTemplateId: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: {
        templateRoleId: roleTemplateId,
        kind: { in: [RoleKind.SYSTEM_INSTANCE, RoleKind.TENANT_INSTANCE] }
      }
    })
    return count > 0
  }

  async findOwnPermissions(roleId: string): Promise<Permission[]> {
    const rps = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true }
    })
    return rps.map((rp) => PermissionMapper.toDomain(rp.permission))
  }

  async findRolesByPermissionId(permissionId: string): Promise<Role[]> {
    const records = await this.prisma.role.findMany({
      where: {
        permissions: {
          some: {
            permissionId
          }
        }
      },
      include: ROLE_INCLUDE
    })

    return records.map(RoleMapper.toDomain)
  }

  async findRolesForAccountId(accountId: string): Promise<Role[]> {
    const now = new Date()
    const accountRoles = await this.prisma.accountRole.findMany({
      where: {
        accountId,
        ...buildActiveAccountRoleWhere(now),
        role: {
          isEnabled: true
        }
      },
      include: { role: { include: ROLE_INCLUDE } }
    })
    return accountRoles.map((ar) =>
      RoleMapper.toDomain(
        (ar as Prisma.AccountRoleGetPayload<{ include: { role: { include: typeof ROLE_INCLUDE } } }>).role
      )
    )
  }

  async assignAccountRole(
    accountId: string,
    roleId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    accountType: AccountType,
    effectiveAt?: Date | null,
    expiresAt?: Date | null
  ): Promise<void> {
    await this.prisma.accountRole.upsert({
      where: {
        accountId_roleId: {
          accountId,
          roleId
        }
      },
      update: {
        tenantId,
        scopeLevel,
        accountType,
        effectiveAt: effectiveAt ?? null,
        expiresAt: expiresAt ?? null
      },
      create: {
        accountId,
        roleId,
        tenantId,
        scopeLevel,
        accountType,
        effectiveAt: effectiveAt ?? null,
        expiresAt: expiresAt ?? null
      }
    })
  }

  async revokeAccountRole(accountId: string, roleId: string): Promise<void> {
    await this.prisma.accountRole.deleteMany({
      where: { accountId, roleId }
    })
  }

  async findAccountRoles(
    accountId: string,
    tenantId?: string | null,
    scopeLevel: ScopeLevel = tenantId ? ScopeLevel.TENANT : ScopeLevel.SYSTEM
  ): Promise<Role[]> {
    const now = new Date()
    const accountRoles = await this.prisma.accountRole.findMany({
      where: {
        accountId,
        scopeLevel,
        ...(scopeLevel === ScopeLevel.SYSTEM ? { tenantId: null } : { tenantId: tenantId! }),
        ...buildActiveAccountRoleWhere(now),
        role: {
          isEnabled: true
        }
      },
      include: { role: { include: ROLE_INCLUDE } }
    })

    const roles = accountRoles.map((ar) =>
      RoleMapper.toDomain(
        (ar as Prisma.AccountRoleGetPayload<{ include: { role: { include: typeof ROLE_INCLUDE } } }>).role
      )
    )

    const repositoryMessage = `findAccountRoles: accountId=${accountId}; tenantId=${tenantId ?? ''}; scopeLevel=${scopeLevel}; bindings=${
      accountRoles.length
    }; roles=${roles.map((role) => `${role.code}[${role.permissions.length}]`).join(',')}`

    if (roles.length === 0 || roles.some((role) => role.permissions.length === 0)) {
      this.logger.warn(repositoryMessage)
    } else {
      this.logger.log(repositoryMessage)
    }

    return roles
  }

  async findTenantRoles(tenantId: string): Promise<Role[]> {
    const records = await this.prisma.role.findMany({
      where: {
        tenantId,
        kind: RoleKind.TENANT_INSTANCE,
        isEnabled: true
      },
      include: ROLE_INCLUDE,
      orderBy: { name: 'asc' }
    })

    return records.map(RoleMapper.toDomain)
  }

  async findSystemRoles(): Promise<Role[]> {
    const records = await this.prisma.role.findMany({
      where: {
        tenantId: null,
        kind: RoleKind.SYSTEM_INSTANCE,
        isEnabled: true
      },
      include: ROLE_INCLUDE,
      orderBy: { name: 'asc' }
    })

    return records.map(RoleMapper.toDomain)
  }

  async findRoleTemplateById(id: string): Promise<Role | null> {
    const found = await this.prisma.role.findFirst({
      where: {
        id,
        kind: RoleKind.SYSTEM_TEMPLATE
      },
      include: ROLE_INCLUDE
    })

    return found ? RoleMapper.toDomain(found) : null
  }

  async findRoleAccounts(roleId: string): Promise<AccountRole[]> {
    const now = new Date()
    const accountRoles = await this.prisma.accountRole.findMany({
      where: {
        roleId,
        ...buildActiveAccountRoleWhere(now)
      }
    })

    return accountRoles.map(
      (accountRole) =>
        new AccountRole(
          accountRole.accountType as AccountType,
          accountRole.accountId,
          accountRole.roleId,
          accountRole.tenantId ?? null,
          accountRole.scopeLevel as ScopeLevel,
          accountRole.effectiveAt ?? null,
          accountRole.expiresAt ?? null
        )
    )
  }

  async replaceAccountRoles(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    accountType: AccountType,
    roleIds: string[]
  ): Promise<Role[]> {
    const uniqueRoleIds = [...new Set(roleIds)]

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.accountRole.findMany({
        where: {
          accountId,
          scopeLevel,
          ...(scopeLevel === ScopeLevel.SYSTEM ? { tenantId: null } : { tenantId: tenantId! })
        }
      })
      const existingRoleIds = new Set(existing.map((item) => item.roleId))
      const targetRoleIds = new Set(uniqueRoleIds)

      const roleIdsToDelete = existing
        .filter((item) => !targetRoleIds.has(item.roleId))
        .map((item) => item.roleId)

      if (roleIdsToDelete.length > 0) {
        await tx.accountRole.deleteMany({
          where: {
            accountId,
            scopeLevel,
            ...(scopeLevel === ScopeLevel.SYSTEM ? { tenantId: null } : { tenantId: tenantId! }),
            roleId: { in: roleIdsToDelete }
          }
        })
      }

      const roleIdsToCreate = uniqueRoleIds.filter((roleId) => !existingRoleIds.has(roleId))

      if (roleIdsToCreate.length > 0) {
        await tx.accountRole.createMany({
          data: roleIdsToCreate.map((roleId) => ({
            accountId,
            tenantId,
            scopeLevel,
            roleId,
            accountType
          }))
        })
      }
    })

    return this.findAccountRoles(accountId, tenantId, scopeLevel)
  }
}
