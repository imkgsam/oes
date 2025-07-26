import { LoginMethod as PrismaLoginMethod } from '../../../prisma/generated/prisma'
export class LoginMethod {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly identifier: string,
    public readonly verified: boolean,
    public readonly enabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  static fromPrisma(prismaLoginMethod: PrismaLoginMethod): LoginMethod {
    return new LoginMethod(
      prismaLoginMethod.id,
      prismaLoginMethod.userId,
      prismaLoginMethod.type,
      prismaLoginMethod.identifier,
      prismaLoginMethod.verified,
      prismaLoginMethod.enabled,
      prismaLoginMethod.createdAt,
      prismaLoginMethod.updatedAt
    )
  }
}
