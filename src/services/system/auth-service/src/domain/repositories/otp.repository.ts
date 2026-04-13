import { OneTimeToken } from '../aggregates/otp.aggregate'
import { OTP_USAGES } from '../../common/constants'

export interface IOtpRepository {
  // ==================== 查询方法 ====================

  /**
   * 根据 ID 查找 OTP
   * @param id OTP ID
   * @returns Promise<OneTimeToken | null>
   */
  findById(id: string): Promise<OneTimeToken | null>

  /**
   * 查找所有 OTP
   * @returns Promise<OneTimeToken[]>
   */
  findAll(): Promise<OneTimeToken[]>

  /**
   * 根据标识符与 usage 查找 OTP
   * @param identifier 标识符（邮箱、手机号等）
   * @param usage OTP 使用场景
   * @returns Promise<OneTimeToken | null>
   */
  findByIdentifierAndUsage(identifier: string, usage: OTP_USAGES): Promise<OneTimeToken | null>

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
  save(otp: OneTimeToken): Promise<OneTimeToken>

  // ==================== 业务操作方法 ====================

  /**
   * 标记 OTP 为已使用
   * @param id OTP ID
   * @returns Promise<void>
   */
  markUsed(id: string): Promise<void>
}
