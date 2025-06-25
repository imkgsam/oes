import { Injectable } from "@nestjs/common";
import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";




@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } })
    return user ? User.fromPrisma(user) : null
  }
  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ where: { phone } })
    return user ? User.fromPrisma(user) : null
  }
  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ where: { googleId } })
    return user ? User.fromPrisma(user) : null
  }
  async findByWechatOpenId(wechatOpenId: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({ where: { wechatOpenId } })
    return user ? User.fromPrisma(user) : null
  }
  async create(user: Partial<User>): Promise<User> {
    const newUser = await this.prismaService.user.create({ data: user })
    return User.fromPrisma(newUser)
  }

}