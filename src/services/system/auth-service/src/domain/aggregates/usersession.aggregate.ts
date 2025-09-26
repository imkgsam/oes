import { randomUUID } from 'crypto'
import { SessionStatus } from '@oes/common/constants/const/auth-service.const'

// 设备信息接口
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  location?: string
  platform?: string
  browser?: string
}

// Session 配置接口
export interface SessionConfig {
  accessTokenExpiry: number // 秒
  refreshTokenExpiry: number // 秒
  maxSessionsPerUser: number
  enableAutoRenewal: boolean
  enableDeviceTracking: boolean
}

/**
 * Session 实体
 *
 * 功能：管理用户会话状态和令牌
 *
 * 使用场景：
 * - 用户登录后的会话管理
 * - 双令牌（访问令牌 + 刷新令牌）机制
 * - 设备级别的会话控制
 * - 管理员对会话的实时控制
 * - 安全审计和监控
 *
 * 技术特点：
 * - 支持自动过期机制
 * - 支持管理员控制（撤销、暂停、恢复）
 * - 设备信息追踪
 * - 多维度安全控制
 */
export class Session {
  constructor(
    private props: {
      id: string
      userId: string
      accountId: string
      accessToken: string
      refreshToken: string
      status: SessionStatus
      deviceInfo: DeviceInfo
      createdAt: Date
      lastActiveAt: Date
      expiresAt: Date
      refreshExpiresAt: Date
      metadata?: Record<string, any>
      // 管理员控制字段
      isAdminControlled: boolean
      adminRevokeReason?: string
      adminRevokeAt?: Date
      adminRevokeBy?: string
    }
  ) {}

  /**
   * 创建新的 Session
   *
   * 使用场景：
   * - 用户首次登录时创建会话
   * - 新设备登录时创建会话
   * - 令牌刷新时创建新会话
   * - 管理员为用户创建会话
   *
   * @param params 创建参数
   * @returns Session 实例
   */
  static createSession(params: {
    userId: string
    accountId: string
    deviceInfo: DeviceInfo
    config: SessionConfig
    metadata?: Record<string, any>
  }): Session {
    const now = new Date()
    const accessTokenExpiry = now.getTime() + params.config.accessTokenExpiry * 1000
    const refreshTokenExpiry = now.getTime() + params.config.refreshTokenExpiry * 1000

    return new Session({
      id: randomUUID(),
      userId: params.userId,
      accountId: params.accountId,
      accessToken: randomUUID(),
      refreshToken: randomUUID(),
      status: SessionStatus.ACTIVE,
      deviceInfo: params.deviceInfo,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(accessTokenExpiry),
      refreshExpiresAt: new Date(refreshTokenExpiry),
      metadata: params.metadata,
      isAdminControlled: false
    })
  }

  /**
   * 从 Redis 数据创建 Session
   *
   * 使用场景：
   * - 从缓存中恢复会话状态
   * - 系统重启后的会话恢复
   * - 分布式部署中的会话同步
   * - 数据迁移和备份恢复
   *
   * @param data Redis 数据
   * @returns Session 实例
   */
  static fromRedis(data: Record<string, any>): Session {
    return new Session({
      id: data.id,
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      status: data.status as SessionStatus,
      deviceInfo: data.deviceInfo,
      createdAt: new Date(data.createdAt),
      lastActiveAt: new Date(data.lastActiveAt),
      expiresAt: new Date(data.expiresAt),
      refreshExpiresAt: new Date(data.refreshExpiresAt),
      metadata: data.metadata,
      isAdminControlled: data.isAdminControlled || false,
      adminRevokeReason: data.adminRevokeReason,
      adminRevokeAt: data.adminRevokeAt ? new Date(data.adminRevokeAt) : undefined,
      adminRevokeBy: data.adminRevokeBy
    })
  }

  /**
   * 转换为 Redis 存储格式
   *
   * 使用场景：
   * - 保存会话到 Redis 缓存
   * - 数据序列化用于传输
   * - 会话状态持久化
   * - 分布式会话同步
   *
   * @returns Redis 数据格式
   */
  toRedis(): Record<string, any> {
    return {
      id: this.props.id,
      userId: this.props.userId,
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      status: this.props.status,
      deviceInfo: this.props.deviceInfo,
      createdAt: this.props.createdAt.toISOString(),
      lastActiveAt: this.props.lastActiveAt.toISOString(),
      expiresAt: this.props.expiresAt.toISOString(),
      refreshExpiresAt: this.props.refreshExpiresAt.toISOString(),
      metadata: this.props.metadata,
      isAdminControlled: this.props.isAdminControlled,
      adminRevokeReason: this.props.adminRevokeReason,
      adminRevokeAt: this.props.adminRevokeAt?.toISOString(),
      adminRevokeBy: this.props.adminRevokeBy
    }
  }

  // ==================== 验证方法 ====================

  /**
   * 验证访问令牌
   *
   * 使用场景：
   * - API 请求时的令牌验证
   * - 检查令牌是否匹配当前会话
   * - 安全审计和监控
   * - 防止令牌伪造
   *
   * @param token 访问令牌
   * @returns 是否有效
   */
  validateAccessToken(token: string): boolean {
    return this.props.accessToken === token && this.isActive() && !this.isExpired()
  }

  /**
   * 验证刷新令牌
   *
   * 使用场景：
   * - 刷新令牌时的验证
   * - 长期会话管理
   * - 令牌轮换机制
   * - 安全审计
   *
   * @param token 刷新令牌
   * @returns 是否有效
   */
  validateRefreshToken(token: string): boolean {
    return this.props.refreshToken === token && this.isActive() && !this.isRefreshExpired()
  }

  // ==================== 状态检查方法 ====================

  /**
   * 检查会话是否过期
   *
   * 使用场景：
   * - 访问令牌过期检查
   * - 自动清理过期会话
   * - 安全策略执行
   * - 性能优化
   *
   * @returns 是否过期
   */
  isExpired(): boolean {
    return Date.now() > this.props.expiresAt.getTime()
  }

  /**
   * 检查刷新令牌是否过期
   *
   * 使用场景：
   * - 刷新令牌过期检查
   * - 长期会话管理
   * - 自动续期判断
   * - 安全策略执行
   *
   * @returns 是否过期
   */
  isRefreshExpired(): boolean {
    return Date.now() > this.props.refreshExpiresAt.getTime()
  }

  /**
   * 检查是否被管理员撤销
   *
   * 使用场景：
   * - 管理员控制检查
   * - 安全事件响应
   * - 用户违规处理
   * - 审计追踪
   *
   * @returns 是否被撤销
   */
  isAdminRevoked(): boolean {
    return this.props.status === SessionStatus.REVOKED && this.props.isAdminControlled
  }

  // ==================== 业务方法 ====================

  /**
   * 更新最后活跃时间
   *
   * 使用场景：
   * - 用户活动时更新会话状态
   * - 会话活跃度监控
   * - 自动续期触发
   * - 用户行为分析
   */
  touch(): void {
    this.props.lastActiveAt = new Date()
  }

  /**
   * 续期访问令牌
   *
   * 使用场景：
   * - 自动续期机制
   * - 用户活跃时延长会话
   * - 安全策略调整
   * - 用户体验优化
   *
   * @param expirySeconds 新的过期时间（秒）
   */
  renewAccessToken(expirySeconds: number): void {
    this.props.expiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  /**
   * 续期刷新令牌
   *
   * 使用场景：
   * - 长期会话管理
   * - 自动续期机制
   * - 安全策略调整
   * - 用户体验优化
   *
   * @param expirySeconds 新的过期时间（秒）
   */
  renewRefreshToken(expirySeconds: number): void {
    this.props.refreshExpiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  // ==================== 管理员控制方法 ====================

  /**
   * 管理员撤销会话
   *
   * 使用场景：
   * - 用户违规处理
   * - 安全事件响应
   * - 可疑设备处理
   * - 强制用户重新登录
   *
   * @param reason 撤销原因
   * @param adminId 管理员 ID
   */
  adminRevoke(reason: string, adminId: string): void {
    this.props.status = SessionStatus.REVOKED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  /**
   * 管理员暂停会话
   *
   * 使用场景：
   * - 临时封禁用户
   * - 调查期间暂停
   * - 可恢复的处罚
   * - 安全事件处理
   *
   * @param reason 暂停原因
   * @param adminId 管理员 ID
   */
  adminSuspend(reason: string, adminId: string): void {
    this.props.status = SessionStatus.SUSPENDED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  /**
   * 恢复会话
   *
   * 使用场景：
   * - 调查结束后的恢复
   * - 误封后的恢复
   * - 处罚期满后的恢复
   * - 安全事件解决
   */
  restore(): void {
    this.props.status = SessionStatus.ACTIVE
    this.props.isAdminControlled = false
    this.props.adminRevokeReason = undefined
    this.props.adminRevokeAt = undefined
    this.props.adminRevokeBy = undefined
  }

  // ==================== 计算属性方法 ====================

  /**
   * 获取剩余时间
   *
   * 使用场景：
   * - 客户端显示剩余时间
   * - 自动续期判断
   * - 用户体验优化
   * - 安全策略执行
   *
   * @returns 剩余秒数
   */
  getRemainingTime(): number {
    const remaining = this.props.expiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  /**
   * 获取刷新令牌剩余时间
   *
   * 使用场景：
   * - 长期会话管理
   * - 自动续期判断
   * - 用户体验优化
   * - 安全策略执行
   *
   * @returns 剩余秒数
   */
  getRefreshRemainingTime(): number {
    const remaining = this.props.refreshExpiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  // ==================== Getter 方法 ====================

  /**
   * 获取会话 ID
   *
   * 使用场景：
   * - 会话标识和追踪
   * - 数据库操作
   * - 日志记录
   * - 审计追踪
   *
   * @returns 会话 ID
   */
  getId(): string {
    return this.props.id
  }

  /**
   * 获取用户 ID
   *
   * 使用场景：
   * - 用户会话关联
   * - 权限验证
   * - 用户行为分析
   * - 安全审计
   *
   * @returns 用户 ID
   */
  getUserId(): string {
    return this.props.userId
  }

  /**
   * 获取访问令牌
   *
   * 使用场景：
   * - API 请求认证
   * - 令牌验证
   * - 安全审计
   * - 调试和监控
   *
   * @returns 访问令牌
   */
  getAccessToken(): string {
    return this.props.accessToken
  }

  /**
   * 获取刷新令牌
   *
   * 使用场景：
   * - 令牌刷新机制
   * - 长期会话管理
   * - 安全审计
   * - 调试和监控
   *
   * @returns 刷新令牌
   */
  getRefreshToken(): string {
    return this.props.refreshToken
  }

  /**
   * 获取会话状态
   *
   * 使用场景：
   * - 状态检查和验证
   * - 安全策略执行
   * - 监控和审计
   * - 用户体验控制
   *
   * @returns 会话状态
   */
  getStatus(): SessionStatus {
    return this.props.status
  }

  /**
   * 获取设备信息
   *
   * 使用场景：
   * - 设备追踪和管理
   * - 安全风险评估
   * - 用户体验优化
   * - 审计和监控
   *
   * @returns 设备信息
   */
  getDeviceInfo(): DeviceInfo {
    return this.props.deviceInfo
  }

  /**
   * 获取创建时间
   *
   * 使用场景：
   * - 会话生命周期管理
   * - 审计追踪
   * - 数据分析
   * - 安全调查
   *
   * @returns 创建时间
   */
  getCreatedAt(): Date {
    return this.props.createdAt
  }

  /**
   * 获取最后活跃时间
   *
   * 使用场景：
   * - 用户活跃度分析
   * - 自动续期判断
   * - 安全风险评估
   * - 用户体验优化
   *
   * @returns 最后活跃时间
   */
  getLastActiveAt(): Date {
    return this.props.lastActiveAt
  }

  /**
   * 获取过期时间
   *
   * 使用场景：
   * - 过期检查
   * - 自动清理
   * - 用户体验优化
   * - 安全策略执行
   *
   * @returns 过期时间
   */
  getExpiresAt(): Date {
    return this.props.expiresAt
  }

  /**
   * 获取刷新令牌过期时间
   *
   * 使用场景：
   * - 长期会话管理
   * - 自动续期判断
   * - 安全策略执行
   * - 用户体验优化
   *
   * @returns 刷新令牌过期时间
   */
  getRefreshExpiresAt(): Date {
    return this.props.refreshExpiresAt
  }

  /**
   * 获取元数据
   *
   * 使用场景：
   * - 扩展信息存储
   * - 自定义业务逻辑
   * - 审计和监控
   * - 数据分析
   *
   * @returns 元数据
   */
  getMetadata(): Record<string, any> | undefined {
    return this.props.metadata
  }

  /**
   * 检查会话是否活跃
   *
   * 使用场景：
   * - 会话有效性验证
   * - 安全策略执行
   * - 用户体验控制
   * - 监控和审计
   *
   * @returns 是否活跃
   */
  isActive(): boolean {
    return this.props.status === SessionStatus.ACTIVE
  }

  /**
   * 检查是否被管理员控制
   *
   * 使用场景：
   * - 管理员权限检查
   * - 安全事件处理
   * - 审计追踪
   * - 权限验证
   *
   * @returns 是否被管理员控制
   */
  isAdminControlled(): boolean {
    return this.props.isAdminControlled
  }

  /**
   * 获取管理员撤销信息
   *
   * 使用场景：
   * - 安全事件调查
   * - 审计追踪
   * - 管理员操作记录
   * - 用户支持
   *
   * @returns 撤销信息
   */
  getAdminRevokeInfo(): {
    reason?: string
    revokedAt?: Date
    revokedBy?: string
  } {
    return {
      reason: this.props.adminRevokeReason,
      revokedAt: this.props.adminRevokeAt,
      revokedBy: this.props.adminRevokeBy
    }
  }
}
