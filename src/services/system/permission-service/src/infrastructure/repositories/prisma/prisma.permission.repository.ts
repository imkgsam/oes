import { Injectable } from '@nestjs/common'
import { Permission } from 'src/domain/entities/permission.entity'
import { PermissionRepository } from 'src/domain/repositories/permission.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Permission[]> {
    const founds = await this.prisma.permission.findMany()
    return founds.map((p) => Permission.fromPrisma(p))
  }

  async findById(id: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { id } })
    return found ? Permission.fromPrisma(found) : null
  }
  async findByCode(code: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { code } })
    return found ? Permission.fromPrisma(found) : null
  }
  async create(permission: Permission): Promise<Permission> {
    const created = await this.prisma.permission.create({
      data: {
        id: permission.id,
        code: permission.code,
        description: permission.description,
        module: permission.module,
      },
    })
    return Permission.fromPrisma(created)
  }
  async delete(id: string): Promise<Permission> {
    const deleted = await this.prisma.permission.delete({ where: { id } })
    return deleted ? Permission.fromPrisma(deleted) : null
  }
  async findAllByModule(module: string): Promise<Permission[]> {
    console.log('Finding permissions by module:', module)
    const founds = await this.prisma.permission.findMany({ where: { module } })
    console.log('Founds by module:', founds)
    return founds.map((p) => Permission.fromPrisma(p))
  }
}
