import { Credential as PrismaCredential } from '../../../prisma/generated/prisma'
export class Credential {
  constructor(
    public readonly id: string,
    public readonly loginMethodId: string,
    public readonly secretType: string,
    public readonly secretValue: string,
    public readonly provider: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  static fromPrisma(prismaCredential: PrismaCredential): Credential {
    return new Credential(
      prismaCredential.id,
      prismaCredential.loginMethodId,
      prismaCredential.secretType,
      prismaCredential.secretValue,
      prismaCredential.provider,
      prismaCredential.createdAt,
      prismaCredential.updatedAt
    )
  }
}
