import { UserRole as PrismaUserRole } from 'prisma/generated/prisma'

export class UserRole {
  constructor(
    public readonly id: string,
    public userId: string,
    public roleId: string,
  ) {}

  static fromPrisma(prisma: PrismaUserRole): UserRole {
    return new UserRole(prisma.id, prisma.userId, prisma.roleId)
  }
}
