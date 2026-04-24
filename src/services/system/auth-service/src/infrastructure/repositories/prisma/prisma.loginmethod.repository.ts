import { Injectable } from '@nestjs/common'
import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { AuthIdentifierNormalizer } from '../../../domain/services/auth-identifier-normalizer'
import { LoginMethodMapper } from '../../mappers/login-method.mapper'
import { PrismaService } from '../../prisma/prisma.service'

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
      where: {
        type: type,
        identifier: this.buildIdentifierLookupCondition(type, identifier),
        enabled: true,
        verified: true
      },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethodMapper.toDomain(found)
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
    return LoginMethodMapper.toDomain(found)
  }

  /**
   * 查找所有登录方法
   * @returns Promise<LoginMethod[]>
   */
  async findAll(): Promise<LoginMethod[]> {
    const founds = await this.prismaService.loginMethod.findMany({
      include: { credentials: true }
    })
    return founds.map((found) => LoginMethodMapper.toDomain(found))
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
      where: {
        type: type as any,
        identifier: this.buildIdentifierLookupCondition(type as LoginMethodType, identifier),
        enabled: true,
        verified: true
      },
      include: { credentials: true }
    })
    if (!found) return null
    return LoginMethodMapper.toDomain(found)
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
    return LoginMethodMapper.toDomain(found)
  }

  async findByUserId(userId: string): Promise<LoginMethod[]> {
    const found = await this.prismaService.loginMethod.findMany({
      where: { userId },
      include: { credentials: true },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }]
    })
    return found.map((record) => LoginMethodMapper.toDomain(record))
  }

  async findByUserIdAndId(userId: string, methodId: string): Promise<LoginMethod | null> {
    const found = await this.prismaService.loginMethod.findFirst({
      where: { id: methodId, userId },
      include: { credentials: true }
    })
    return found ? LoginMethodMapper.toDomain(found) : null
  }

  // ==================== 保存方法 ====================

  /**
   * 保存登录方法（创建或更新）
   *
   * 推荐使用此方法，配合领域实体：
   * ```typescript
   * const loginMethod = await repo.findById(id)
   * loginMethod?.verify()
   * await repo.save(loginMethod)
   * ```
   *
   * @param loginMethod 登录方法实体
   * @returns Promise<LoginMethod>
   */
  async save(loginMethod: LoginMethod): Promise<LoginMethod> {
    const data = LoginMethodMapper.toPersistence(loginMethod)
    const credentials = loginMethod.getCredentials()
    const normalizedIdentifier = AuthIdentifierNormalizer.normalize(
      data.type as LoginMethodType,
      data.identifier
    )
    const updated = await this.prismaService.$transaction(async (tx) => {
      await tx.loginMethod.upsert({
        where: { id: loginMethod.id },
        update: {
          userId: data.userId,
          type: data.type as any,
          identifier: normalizedIdentifier,
          verified: data.verified,
          enabled: data.enabled,
          updatedAt: data.updatedAt
        },
        create: {
          id: data.id,
          userId: data.userId,
          type: data.type as any,
          identifier: normalizedIdentifier,
          verified: data.verified,
          enabled: data.enabled,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      })

      for (const credential of credentials) {
        await tx.credential.upsert({
          where: { id: credential.id },
          update: {
            credentialType: credential.type,
            hashedValue: credential.getSecret() || null,
            provider: credential.provider ?? null,
            enabled: credential.isEnabled(),
            updatedAt: credential.updatedAt
          },
          create: {
            id: credential.id,
            loginMethodId: loginMethod.id,
            credentialType: credential.type,
            hashedValue: credential.getSecret() || null,
            provider: credential.provider ?? null,
            enabled: credential.isEnabled(),
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt
          }
        })
      }

      return tx.loginMethod.findUniqueOrThrow({
        where: { id: loginMethod.id },
        include: { credentials: true }
      })
    })
    return LoginMethodMapper.toDomain(updated)
  }

  // Builds tolerant identifier lookup conditions so legacy phone formats still resolve the same login method.
  private buildIdentifierLookupCondition(type: LoginMethodType, identifier: string) {
    const normalizedIdentifier = AuthIdentifierNormalizer.normalize(type, identifier)

    if (type !== LoginMethodType.PHONE) {
      return normalizedIdentifier
    }

    if (!/^\+?\d{6,20}$/.test(normalizedIdentifier)) {
      return normalizedIdentifier
    }

    const digitsOnly = normalizedIdentifier.replace(/^\+/, '')
    const candidates = Array.from(
      new Set(
        normalizedIdentifier.startsWith('+')
          ? [normalizedIdentifier, digitsOnly]
          : [normalizedIdentifier, `+${digitsOnly}`]
      )
    )

    return candidates.length === 1 ? candidates[0] : { in: candidates }
  }
}
