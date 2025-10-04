/**
 * 域名验证状态值对象
 *
 * 用途：
 * 1. 封装域名验证状态的业务逻辑
 * 2. 确保状态转换的合法性
 * 3. 提供类型安全的状态管理
 *
 * 状态说明：
 * - PENDING: 待验证，新创建的域名默认状态
 * - VERIFIED: 已验证，通过DNS验证
 * - FAILED: 验证失败，DNS验证未通过
 * - EXPIRED: 验证过期，需要重新验证
 */
export enum DomainVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED'
}

/**
 * 域名验证状态值对象类
 * 提供状态转换的业务逻辑
 */
export class DomainVerificationStatusVO {
  constructor(private readonly status: DomainVerificationStatus) {}

  /**
   * 获取当前状态
   */
  getValue(): DomainVerificationStatus {
    return this.status
  }

  /**
   * 检查是否为待验证状态
   */
  isPending(): boolean {
    return this.status === DomainVerificationStatus.PENDING
  }

  /**
   * 检查是否已验证
   */
  isVerified(): boolean {
    return this.status === DomainVerificationStatus.VERIFIED
  }

  /**
   * 检查是否验证失败
   */
  isFailed(): boolean {
    return this.status === DomainVerificationStatus.FAILED
  }

  /**
   * 检查是否验证过期
   */
  isExpired(): boolean {
    return this.status === DomainVerificationStatus.EXPIRED
  }

  /**
   * 检查是否可以重新验证
   */
  canRetry(): boolean {
    return (
      this.status === DomainVerificationStatus.FAILED ||
      this.status === DomainVerificationStatus.EXPIRED
    )
  }

  /**
   * 检查是否可以标记为已验证
   */
  canMarkAsVerified(): boolean {
    return this.status === DomainVerificationStatus.PENDING
  }

  /**
   * 检查是否可以标记为验证失败
   */
  canMarkAsFailed(): boolean {
    return this.status === DomainVerificationStatus.PENDING
  }

  /**
   * 检查是否可以标记为过期
   */
  canMarkAsExpired(): boolean {
    return this.status === DomainVerificationStatus.VERIFIED
  }

  /**
   * 转换为已验证状态
   */
  markAsVerified(): DomainVerificationStatusVO {
    if (!this.canMarkAsVerified()) {
      throw new Error(`Cannot mark domain as verified from ${this.status} status`)
    }
    return new DomainVerificationStatusVO(DomainVerificationStatus.VERIFIED)
  }

  /**
   * 转换为验证失败状态
   */
  markAsFailed(): DomainVerificationStatusVO {
    if (!this.canMarkAsFailed()) {
      throw new Error(`Cannot mark domain as failed from ${this.status} status`)
    }
    return new DomainVerificationStatusVO(DomainVerificationStatus.FAILED)
  }

  /**
   * 转换为过期状态
   */
  markAsExpired(): DomainVerificationStatusVO {
    if (!this.canMarkAsExpired()) {
      throw new Error(`Cannot mark domain as expired from ${this.status} status`)
    }
    return new DomainVerificationStatusVO(DomainVerificationStatus.EXPIRED)
  }

  /**
   * 重置为待验证状态
   */
  resetToPending(): DomainVerificationStatusVO {
    return new DomainVerificationStatusVO(DomainVerificationStatus.PENDING)
  }

  /**
   * 获取状态描述
   */
  getDescription(): string {
    switch (this.status) {
      case DomainVerificationStatus.PENDING:
        return '待验证'
      case DomainVerificationStatus.VERIFIED:
        return '已验证'
      case DomainVerificationStatus.FAILED:
        return '验证失败'
      case DomainVerificationStatus.EXPIRED:
        return '验证过期'
      default:
        return '未知状态'
    }
  }

  /**
   * 比较两个状态是否相等
   */
  equals(other: DomainVerificationStatusVO): boolean {
    return this.status === other.status
  }

  /**
   * 创建默认状态（待验证）
   */
  static createPending(): DomainVerificationStatusVO {
    return new DomainVerificationStatusVO(DomainVerificationStatus.PENDING)
  }

  /**
   * 从字符串创建状态对象
   */
  static fromString(status: string): DomainVerificationStatusVO {
    if (!Object.values(DomainVerificationStatus).includes(status as DomainVerificationStatus)) {
      throw new Error(`Invalid domain verification status: ${status}`)
    }
    return new DomainVerificationStatusVO(status as DomainVerificationStatus)
  }
}
