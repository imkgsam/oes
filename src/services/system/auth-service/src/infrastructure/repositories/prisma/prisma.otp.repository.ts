import { Injectable } from '@nestjs/common'
import { OneTimeToken } from 'src/domain/entities/otp.entity'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'

@Injectable()
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ==================== 查询方法 ====================

  /**
   * 根据 ID 查找 OTP
   * @param id OTP ID
   * @returns Promise<OneTimeToken | null>
   */
  async findById(id: string): Promise<OneTimeToken | null> {
    const found = await this.prismaService.oneTimeToken.findUnique({
      where: { id },
    })
    if (!found) return null
    return OneTimeToken.fromPrisma(found)
  }

  /**
   * 查找所有 OTP
   * @returns Promise<OneTimeToken[]>
   */
  async findAll(): Promise<OneTimeToken[]> {
    const founds = await this.prismaService.oneTimeToken.findMany()
    return founds.map((found) => OneTimeToken.fromPrisma(found))
  }

  // ==================== 保存方法 ====================

  /**
   * 保存 OTP（创建或更新）
   *
   * 推荐使用此方法，配合领域实体：
   * ```typescript
   * const otp = OneTimeToken.createMfaOtp({...})
   * await repo.save(otp)
   * ```
   *
   * @param otp OTP 实体
   * @returns Promise<OneTimeToken>
   */
  async save(otp: OneTimeToken): Promise<OneTimeToken> {
    const props = otp.getProps()
    // 使用 upsert 来创建或更新
    const updated = await this.prismaService.oneTimeToken.upsert({
      where: { id: props.id },
      update: {
        type: props.type,
        usage: props.usage,
        identifier: props.identifier,
        code: props.code,
        expiredAt: props.expiredAt,
        consumed: props.consumed,
        attemptCount: props.attemptCount,
        maxAttempt: props.maxAttempt,
        valid: props.valid,
        updatedAt: new Date(),
      },
      create: {
        id: props.id,
        type: props.type,
        usage: props.usage,
        identifier: props.identifier,
        code: props.code,
        expiredAt: props.expiredAt,
        consumed: props.consumed,
        attemptCount: props.attemptCount,
        maxAttempt: props.maxAttempt,
        valid: props.valid,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return OneTimeToken.fromPrisma(updated)
  }

  // ==================== 业务操作方法 ====================

  /**
   * 标记 OTP 为已使用
   * @param id OTP ID
   * @returns Promise<void>
   */
  async markUsed(id: string): Promise<void> {
    await this.prismaService.oneTimeToken.update({
      where: { id },
      data: { consumed: true },
    })
  }
}
