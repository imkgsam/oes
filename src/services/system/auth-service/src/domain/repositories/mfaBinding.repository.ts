import { MfaType } from 'src/common/const'
import { MfaBindingEntity } from '../aggregates/mfabinding.aggregate'

export interface IMfaBindingRepository {
  // ==================== 查询方法 ====================

  /**
   * 根据 ID 查找 MFA 绑定
   * @param id 绑定 ID
   * @returns Promise<MfaBindingEntity | null>
   */
  findById(id: string): Promise<MfaBindingEntity | null>

  /**
   * 根据用户 ID 和类型查找 MFA 绑定
   * @param userId 用户 ID
   * @param type MFA 类型
   * @returns Promise<MfaBindingEntity | null>
   */
  findByUserIdAndType(userId: string, type: MfaType): Promise<MfaBindingEntity | null>

  /**
   * 查找用户的所有 MFA 绑定
   * @param userId 用户 ID
   * @returns Promise<MfaBindingEntity[]>
   */
  findAllByUserId(userId: string): Promise<MfaBindingEntity[]>

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
  save(binding: MfaBindingEntity): Promise<MfaBindingEntity>

  // ==================== 删除方法 ====================

  /**
   * 删除 MFA 绑定
   * @param id 绑定 ID
   * @returns Promise<void>
   */
  delete(id: string): Promise<void>
}
