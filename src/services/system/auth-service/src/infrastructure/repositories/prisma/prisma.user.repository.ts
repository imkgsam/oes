import { Injectable } from "@nestjs/common";
import { User } from "src/domain/entities/user.entity";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";


@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) { }
  async findByFields(fields: Partial<User>): Promise<User | null> {
    const filters = Object.entries(fields)
      .filter(([key, value]) => value != null && key != 'password')
      .map(([key, value]) => ({ [key]: value }));
    console.log(fields)
    if (filters.length === 0) return null;
    const foundUser = await this.prismaService.user.findFirst({
      where: {
        OR: filters as any,
      }
    })
    return foundUser ? User.fromPrisma(foundUser) : null
  }

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
    console.log('user: ', user)
    const newUser = await this.prismaService.user.create({ data: { email: user.email, passwordHash: user.passwordHash } })
    return User.fromPrisma(newUser)
  }
}