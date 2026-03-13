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

  async save(permission: Permission): Promise<Permission> {
    const data = PermissionMapper.toPersistant(permission)
    const saved = await this.prisma.permission.upsert({
      where: { id: permission.id },
      update: { code: data.code, module: data.module, description: data.description },
      create: data
    })
    return PermissionMapper.toDomain(saved)
  }

  async delete(id: string): Promise<Permission | null> {
    const deleted = await this.prisma.permission.delete({ where: { id } })
    return deleted ? PermissionMapper.toDomain(deleted) : null
  }
}
