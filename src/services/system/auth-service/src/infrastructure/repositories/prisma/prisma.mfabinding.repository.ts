import { Injectable } from '@nestjs/common'
import { MfaBindingEntity } from 'src/domain/aggregates/mfabinding.aggregate'
import { IMfaBindingRepository } from 'src/domain/repositories/mfaBinding.repository'
import { MfaBindingMapper } from 'src/infrastructure/mappers/mfa-binding.mapper'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'
import { MfaType } from '@oes/common/constants'

@Injectable()
export class PrismaMfaBindingRepository implements IMfaBindingRepository {
  constructor(private readonly prismaService: PrismaService) {}

  // ==================== 查询方法 ====================

  /**
   * 根据 ID 查找 MFA 绑定
   * @param id 绑定 ID
   * @returns Promise<MfaBindingEntity | null>
   */
  async findById(id: string): Promise<MfaBindingEntity | null> {
    const found = await this.prismaService.mfaBinding.findUnique({
      where: { id }
    })
    if (!found) return null
    return MfaBindingMapper.toDomain(found)
  }

  /**
   * 根据用户 ID 和类型查找 MFA 绑定
   * @param userId 用户 ID
   * @param type MFA 类型
   * @returns Promise<MfaBindingEntity | null>
   */
  async findByUserIdAndType(userId: string, type: MfaType): Promise<MfaBindingEntity | null> {
    const found = await this.prismaService.mfaBinding.findFirst({
      where: { userId, type }
    })
    if (!found) return null
    return MfaBindingMapper.toDomain(found)
  }

  /**
   * 查找用户的所有 MFA 绑定
   * @param userId 用户 ID
   * @returns Promise<MfaBindingEntity[]>
   */
  async findAllByUserId(userId: string): Promise<MfaBindingEntity[]> {
    const founds = await this.prismaService.mfaBinding.findMany({
      where: { userId }
    })
    return founds.map((found) => MfaBindingMapper.toDomain(found))
  }

  // ==================== 保存方法 ====================

  /**
   * 保存 MFA 绑定（创建或更新）
   *
   * 推荐使用此方法，配合领域实体：
   * ```typescript
   * const binding = MfaBindingEntity.createTotpBinding(userId)
   * await repo.save(binding)
   * ```
   *
   * @param binding MFA 绑定实体
   * @returns Promise<MfaBindingEntity>
   */
  async save(binding: MfaBindingEntity): Promise<MfaBindingEntity> {
    const data = MfaBindingMapper.toPersistence(binding)
    const updated = await this.prismaService.mfaBinding.upsert({
      where: { id: binding.getId() },
      update: {
        userId: data.userId,
        type: data.type,
        secret: data.secret,
        enabled: data.enabled,
        metadata: data.metadata,
        deviceInfo: data.deviceInfo,
        updatedAt: data.updatedAt
      },
      create: {
        id: data.id,
        userId: data.userId,
        type: data.type,
        secret: data.secret,
        enabled: data.enabled,
        metadata: data.metadata,
        deviceInfo: data.deviceInfo,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    })
    return MfaBindingMapper.toDomain(updated)
  }

  // ==================== 删除方法 ====================

  /**
   * 删除 MFA 绑定
   * @param id 绑定 ID
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await this.prismaService.mfaBinding.delete({
      where: { id }
    })
  }
}
