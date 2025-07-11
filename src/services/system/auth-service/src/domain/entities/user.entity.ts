import { User as PrismaUser } from '../../../prisma/generated/prisma'
import * as bcrypt from 'bcrypt'
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly passwordHash: string | null,
    public readonly googleId: string | null,
    public readonly wechatOpenId: string | null,
  ) {}

  static fromPrisma(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.phone,
      prismaUser.passwordHash,
      prismaUser.googleId,
      prismaUser.wechatOpenId,
    )
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.passwordHash) return bcrypt.compare(password, this.passwordHash)
    return false
  }

  hasPassword(): boolean {
    return this.passwordHash !== null && this.passwordHash !== undefined
  }
}
