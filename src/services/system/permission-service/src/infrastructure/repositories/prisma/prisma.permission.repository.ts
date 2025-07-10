import { Injectable } from '@nestjs/common';
import { Permission } from 'src/domain/entities/permission.entity';
import { PermissionRepository } from 'src/domain/repositories/permission.repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {

  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { id } });
    return found ? Permission.fromPrisma(found) : null;
  }
  async findByCode(code: string): Promise<Permission | null> {
    const found = await this.prisma.permission.findUnique({ where: { code } });
    return found ? Permission.fromPrisma(found) : null;
  }
  async create(permission: Permission): Promise<void> {
    await this.prisma.permission.create({
      data: {
        id: permission.id,
        code: permission.code,
        description: permission.description,
        module: permission.module,
      },
    });
  }
  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
  async findAllByModule(module: string): Promise<Permission[]> {
    const founds = await this.prisma.permission.findMany({ where: { module } })
    return founds.map(p => Permission.fromPrisma(p));
  }
}