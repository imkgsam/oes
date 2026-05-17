import { Injectable } from '@nestjs/common'
import { Permission } from '../../../domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'
import { PermissionRepository } from '../../../domain/repositories/permission.repository'
import { PermissionMapper } from '../../mappers/permission.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { id } })
    return found ? PermissionMapper.toDomain(found) : null
  }

  async findByCode(code: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { code } })
    return found ? PermissionMapper.toDomain(found) : null
  }

  async findAll(): Promise<Permission[]> {
    const records = await this.prisma.permission.findMany()
    return records.map(PermissionMapper.toDomain)
  }

  async findByModule(module: PermissionModule): Promise<Permission[]> {
    const records = await this.prisma.permission.findMany({ where: { module } })
    return records.map(PermissionMapper.toDomain)
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    if (codes.length === 0) return []
    const records = await this.prisma.permission.findMany({
      where: { code: { in: codes } }
    })
    return records.map(PermissionMapper.toDomain)
  }

  async findPaged(query: {
    page: number
    pageSize: number
    module?: PermissionModule
    keyword?: string
  }): Promise<{ permissions: Permission[]; total: number; page: number; pageSize: number }> {
    const page = query.page
    const pageSize = query.pageSize
    const skip = (page - 1) * pageSize
    const keyword = query.keyword?.trim()

    const where = {
      ...(query.module ? { module: query.module } : {}),
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword, mode: 'insensitive' as const } },
              { description: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.permission.count({ where })
    ])

    return {
      permissions: records.map(PermissionMapper.toDomain),
      total,
      page,
      pageSize
    }
  }

  async hasAssignedRoles(permissionId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({ where: { permissionId } })
    return count > 0
  }

  async hasAttachedPolicies(permissionCode: string): Promise<boolean> {
    const count = await this.prisma.policy.count({ where: { permissionCode } })
    return count > 0
  }

  async hasAttachedPolicyInstances(permissionCode: string): Promise<boolean> {
    const count = await this.prisma.policyInstance.count({ where: { permissionCode } })
    return count > 0
  }

  async save(permission: Permission): Promise<Permission> {
    const data = PermissionMapper.toPersistant(permission)
    const saved = await this.prisma.permission.upsert({
      where: { id: permission.id },
      update: { code: data.code, module: data.module, description: data.description },
      create: data
    })
    return PermissionMapper.toDomain(saved)
  }

  async createMany(permissions: Permission[]): Promise<Permission[]> {
    if (permissions.length === 0) return []

    const data = permissions.map((permission) => PermissionMapper.toPersistant(permission))
    await this.prisma.permission.createMany({ data })

    const created = await this.prisma.permission.findMany({
      where: { id: { in: permissions.map((permission) => permission.id) } },
      orderBy: { createdAt: 'asc' }
    })

    return created.map(PermissionMapper.toDomain)
  }

  async delete(id: string): Promise<Permission | null> {
    const deleted = await this.prisma.permission.delete({ where: { id } })
    return deleted ? PermissionMapper.toDomain(deleted) : null
  }
}
