import { Injectable } from '@nestjs/common'
import { LoginMethod } from 'src/domain/entities/loginmethod.entity'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaUserRepository implements ILoginMethodRepository {
  constructor(private readonly prismaService: PrismaService) { }
  async findById(id: string): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findUnique({
      where: { id },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethod.fromPrisma(found)
  }
  async findAll(): Promise<LoginMethod[]> {
    const founds = await this.prismaService.loginMethod.findMany({
      include: { credentials: true }
    })
    return founds.map(LoginMethod.fromPrisma)
  }
  async save(newOne: Partial<LoginMethod>): Promise<LoginMethod> {
    throw new Error('Method not implemented.')
  }
  async delete(id: string): Promise<LoginMethod> {
    throw new Error('Method not implemented.')
  }
}
