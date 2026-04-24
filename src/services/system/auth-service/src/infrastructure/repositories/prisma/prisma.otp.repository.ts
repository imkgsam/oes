import { Injectable } from '@nestjs/common'
import { OTP_USAGES } from '../../../common/constants'
import { OneTimeToken } from '../../../domain/aggregates/otp.aggregate'
import { IOtpRepository } from '../../../domain/repositories/otp.repository'
import { OtpMapper } from '../../mappers/otp.mapper'
import { PrismaService } from '../../prisma/prisma.service'

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
    const found = await this.prismaService.oTP.findUnique({
      where: { id }
    })
    if (!found) return null
    return OtpMapper.toDomain(found)
  }

  /**
   * 查找所有 OTP
   * @returns Promise<OneTimeToken[]>
   */
  async findAll(): Promise<OneTimeToken[]> {
    const founds = await this.prismaService.oTP.findMany()
    return founds.map((found) => OtpMapper.toDomain(found))
  }

  async findByIdentifierAndUsage(
    identifier: string,
    usage: OTP_USAGES
  ): Promise<OneTimeToken | null> {
    const found = await this.prismaService.oTP.findUnique({
      where: {
        identifier_usage: {
          identifier,
          usage
        }
      }
    })
    if (!found) return null
    return OtpMapper.toDomain(found)
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
    const data = OtpMapper.toPersistence(otp)
    const props = otp.getProps()
    const existing = await this.findByIdentifierAndUsage(props.identifier, props.usage)

    if (existing && existing.getProps().id !== props.id) {
      await this.prismaService.oTP.delete({
        where: {
          identifier_usage: {
            identifier: props.identifier,
            usage: props.usage
          }
        }
      })
    }

    const updated = await this.prismaService.oTP.upsert({
      where: { id: props.id },
      update: {
        type: data.type,
        usage: data.usage,
        identifier: data.identifier,
        hashedValue: data.hashedValue,
        lastSentAt: data.lastSentAt,
        expiredAt: data.expiredAt,
        consumed: data.consumed,
        attemptCount: data.attemptCount,
        maxAttempt: data.maxAttempt,
        valid: data.valid,
        updatedAt: data.updatedAt
      },
      create: data
    })
    return OtpMapper.toDomain(updated)
  }

  // ==================== 业务操作方法 ====================

  /**
   * 标记 OTP 为已使用
   * @param id OTP ID
   * @returns Promise<void>
   */
  async markUsed(id: string): Promise<void> {
    await this.prismaService.oTP.update({
      where: { id },
      data: {
        consumed: true,
        valid: false,
        updatedAt: new Date()
      }
    })
  }
}
