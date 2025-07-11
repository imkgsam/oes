import { Injectable } from '@nestjs/common'
import { UserScope } from 'src/domain/entities/user-scope.entity'
import { UserScopeRepository } from 'src/domain/repositories/user-scope.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaUserScopeRepository implements UserScopeRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByUserId(userId: string): Promise<UserScope[]> {
    const founds = await this.prisma.userScope.findMany({
      where: { userId },
    })
    return founds.map((s) => UserScope.fromPrisma(s))
  }
  async add(scope: UserScope): Promise<UserScope> {
    const created = await this.prisma.userScope.create({
      data: {
        userId: scope.userId,
        permissionCode: scope.permissionCode,
        resourceType: scope.resourceType,
        resourceId: scope.resourceId,
      },
    })
    return UserScope.fromPrisma(created)
  }
  async remove(id: string): Promise<UserScope> {
    const deleted = await this.prisma.userScope.delete({
      where: { id },
    })
    return UserScope.fromPrisma(deleted)
  }
}
