import { Injectable } from '@nestjs/common'
import { Permission } from 'src/domain/aggregates/permission.aggregate'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { PermissionMapper } from 'src/infrastructure/mappers/permission.mapper'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Permission | null> {
    const found = this.prisma.permission.findUnique({
      where: { id }
    })
    if (!found) return null
    return PermissionMapper.toDomain(found)
  }

  async findByCode(code: string): Promise<Permission | null> {
    const found = this.prisma.permission.findUnique({
      where: { code }
    })
    if (!found) return null
    return PermissionMapper.toDomain(found)
  }
}
