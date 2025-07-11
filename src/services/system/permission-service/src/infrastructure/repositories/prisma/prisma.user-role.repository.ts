import { Injectable } from '@nestjs/common'
import { UserRole } from 'src/domain/entities/user-role.entity'
import { UserRoleRepository } from 'src/domain/repositories/user-role.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaUserRoleRepository implements UserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserRole[]> {
    const founds = await this.prisma.userRole.findMany({ where: { userId } })
    return founds.map((r) => UserRole.fromPrisma(r))
  }
  async add(userRole: UserRole): Promise<UserRole> {
    const created = await this.prisma.userRole.create({
      data: {
        userId: userRole.userId,
        roleId: userRole.roleId,
      },
    })
    return UserRole.fromPrisma(created)
  }
  async remove(userId: string, roleId: string): Promise<UserRole> {
    const deleted = await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })
    return UserRole.fromPrisma(deleted)
  }
}
