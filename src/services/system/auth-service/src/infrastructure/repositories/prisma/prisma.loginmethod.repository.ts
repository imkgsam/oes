import { Injectable } from '@nestjs/common'
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from 'src/domain/aggregates/loginmethod.aggregate'
import { ILoginMethodRepository } from 'src/domain/repositories/loginmethod.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaUserRepository implements ILoginMethodRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ==================== 查询方法 ====================

  /**
   * 根据类型和标识符查找登录方法
   * @param type 登录类型
   * @param identifier 标识符（邮箱、手机号等）
   * @returns Promise<LoginMethod | null>
   */
  async findByTypeAndIdentifier(
    type: LoginMethodType,
    identifier: string
  ): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findFirst({
      where: { type: type, identifier, enabled: true, verified: true },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethod.fromPrisma(found)
  }
  /**
   * 根据 ID 查找登录方法
   * @param id 登录方法 ID
   * @returns Promise<LoginMethod | null>
   */
  async findById(id: string): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findUnique({
      where: { id },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethod.fromPrisma(found)
  }

  /**
   * 查找所有登录方法
   * @returns Promise<LoginMethod[]>
   */
  async findAll(): Promise<LoginMethod[]> {
    const founds = await this.prismaService.loginMethod.findMany({
      include: { credentials: true }
    })
    return founds.map((found) => LoginMethod.fromPrisma(found))
  }

  /**
   * 根据类型和标识符查找 有效的 登录方法
   * @param type 登录类型
   * @param identifier 标识符（邮箱、手机号等）
   * @returns Promise<LoginMethod | null>
   */
  async findValidOneByTypeAndIdentifier(
    type: string,
    identifier: string
  ): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findFirst({
      where: { type: type as any, identifier, enabled: true, verified: true },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethod.fromPrisma(found)
  }

  /**
   * 根据用户 ID 和类型查找登录方法
   * @param userId 用户 ID
   * @param type 登录类型
   * @returns Promise<LoginMethod | null>
   */
  async findByUserIdAndType(userId: string, type: string): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findFirst({
      where: { userId, type: type as any },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethod.fromPrisma(found)
  }

  // ==================== 保存方法 ====================

  /**
   * 保存登录方法（创建或更新）
   *
   * 推荐使用此方法，配合领域实体：
   * ```typescript
   * const loginMethod = LoginMethod.fromPrisma(prismaData)
   * loginMethod.verify()
   * await repo.save(loginMethod)
   * ```
   *
   * @param loginMethod 登录方法实体
   * @returns Promise<LoginMethod>
   */
  async save(loginMethod: LoginMethod): Promise<LoginMethod> {
    // 使用 upsert 来创建或更新
    const updated = await this.prismaService.loginMethod.upsert({
      where: { id: loginMethod.id },
      update: {
        userId: loginMethod.userId,
        type: loginMethod.type as any,
        identifier: loginMethod.identifier,
        verified: loginMethod.isVerified(),
        enabled: loginMethod.isEnabled(),
        updatedAt: new Date()
      },
      create: {
        id: loginMethod.id,
        userId: loginMethod.userId,
        type: loginMethod.type as any,
        identifier: loginMethod.identifier,
        verified: loginMethod.isVerified(),
        enabled: loginMethod.isEnabled(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: { credentials: true }
    })
    return LoginMethod.fromPrisma(updated)
  }
}
