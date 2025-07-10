import { Injectable } from "@nestjs/common";
import { Role } from "src/domain/entities/role.entity";
import { RoleRepository } from "src/domain/repositories/role.repository";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";


@Injectable()
export class PrismaRoleRepository implements RoleRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Role | null> {
        const found = await this.prisma.role.findUnique({ where: { id }, include: { permissions: true, users: true } });
        return found ? Role.fromPrisma(found, found.permissions, found.users) : null
    }
    async findAll(): Promise<Role[]> {
        const founds = await this.prisma.role.findMany({})
        return founds.map(r => Role.fromPrisma(r))
    }
    async save(role: Role): Promise<Role> {
        const saved = await this.prisma.role.upsert({
            where: { id: role.id },
            update: {
                name: role.name,
                description: role.description,
                module: role.module,
            },
            create: {
                id: role.id,
                name: role.name,
                description: role.description,
                module: role.module,
            },
            include: {
                permissions: true,
                users: true,
            }
        });
        return Role.fromPrisma(saved, saved.permissions, saved.users);
    }
    async delete(id: string): Promise<Role> {
       const deleted = await this.prisma.role.delete({ where: { id }});
       return Role.fromPrisma(deleted);
    }
}