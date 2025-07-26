import { OneTimeToken as PrismaOneTimeToken } from '../../../prisma/generated/prisma'
export class OneTimeToken {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly usage: string,
    public readonly identifier: string,
    public readonly code: string,
    public readonly expiredAt: Date,
    public readonly consumed: boolean,
    public readonly attemptCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

  ) { }

  static fromPrisma(prismaOneTimeToken: PrismaOneTimeToken): OneTimeToken {
    return new OneTimeToken(
      prismaOneTimeToken.id,
      prismaOneTimeToken.type,
      prismaOneTimeToken.usage,
      prismaOneTimeToken.identifier,
      prismaOneTimeToken.code,
      prismaOneTimeToken.expiredAt,
      prismaOneTimeToken.consumed,
      prismaOneTimeToken.attemptCount,
      prismaOneTimeToken.createdAt,
      prismaOneTimeToken.updatedAt
    )
  }
}
