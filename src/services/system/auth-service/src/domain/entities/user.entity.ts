
import { User as PrismaUser } from '@prisma/client'
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string | null,
    public readonly phone: string | null,
    private passwordHash: string | null,
    public readonly googleId: string | null,
    public readonly wechatOpenId: string | null

  ) { }

  static fromPrisma(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.email,
      prismaUser.phone,
      prismaUser.passwordHash,
      prismaUser.googleId,
      prismaUser.wechatOpenId
    )
  }

  async validatePassword(password: string, compareFunction: (a: string, b: string) => Promise<boolean>): Promise<boolean> {
    if (this.passwordHash)
      return compareFunction(password, this.passwordHash)
    return false
  }

  hasPassword(): boolean {
    return this.passwordHash !== null && this.passwordHash !== undefined
  }

  changePassword(newHash: string) {
    this.passwordHash = newHash
  }

}