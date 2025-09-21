import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService } from '@oes/common/modules/jwt/jwt.service'
import { Session, SessionConfig, DeviceInfo } from 'src/domain/aggregates/usersession.aggregate'
import { ISessionRepository } from 'src/domain/repositories/session.repository'
import { SESSION_REPOSITORY } from 'src/common/constants/injection-tokens'

/**
 * Session 服务
 *
 * 功能：管理用户会话的核心业务逻辑
 *
 * 使用场景：
 * - 用户登录后的会话创建和管理
 * - 双令牌（访问令牌 + 刷新令牌）机制
 * - 自动续期和令牌轮换
 * - 管理员对会话的实时控制
 * - 设备级别的会话管理
 * - 安全审计和监控
 *
 * 技术特点：
 * - 集成 CommonJwtService 进行令牌生成
 * - 使用 TokenConfig 进行配置管理
 * - 支持自动续期机制
 * - 多维度安全控制
 * - 实时监控和统计
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)
  private readonly defaultConfig: SessionConfig = {
    accessTokenExpiry: 3600, // 1小时
    refreshTokenExpiry: 7 * 24 * 3600, // 7天
    maxSessionsPerUser: 5,
    enableAutoRenewal: true,
    enableDeviceTracking: true
  }

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: ISessionRepository,
    private readonly commonJwtService: CommonJwtService,
    private readonly configService: ConfigService
  ) {}

  // ==================== 核心方法 ====================

  /**
   * 创建新的用户会话
   *
   * 使用场景：
   * - 用户首次登录时创建会话
   * - 新设备登录时创建会话
   * - 令牌刷新时创建新会话
   * - 管理员为用户创建会话
   * - 多设备登录管理
   *
   * @param userId 用户 ID
   * @param deviceInfo 设备信息
   * @param config 会话配置（可选）
   * @returns 创建的会话信息
   */
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo,
    config?: Partial<SessionConfig>
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    // 检查会话数量限制
    await this.checkSessionLimit(userId)

    // 获取令牌配置
    const tokenConfig = this.configService.getOrThrow('token')
    const accessTokenExpiry =
      tokenConfig?.accessTokenValidity || this.defaultConfig.accessTokenExpiry
    const refreshTokenExpiry =
      tokenConfig?.refreshTokenValidity || this.defaultConfig.refreshTokenExpiry

    // 合并配置
    const sessionConfig: SessionConfig = {
      ...this.defaultConfig,
      accessTokenExpiry,
      refreshTokenExpiry,
      ...config
    }

    // 创建会话实体
    const session = Session.createSession({
      userId,
      deviceInfo,
      config: sessionConfig
    })

    // 生成 JWT 令牌
    const accessToken = await this.generateJwtToken(session, 'ACCESS')
    const refreshToken = await this.generateJwtToken(session, 'REFRESH')

    // 更新会话的令牌
    session['props'].accessToken = accessToken
    session['props'].refreshToken = refreshToken

    // 保存会话
    await this.sessionRepo.save(session)

    this.logger.log(`Created session for user ${userId} on device ${deviceInfo.deviceId}`)

    return {
      accessToken,
      refreshToken,
      sessionId: session.getId()
    }
  }

  /**
   * 验证访问令牌
   *
   * 使用场景：
   * - API 请求时的令牌验证
   * - 获取令牌对应的会话信息
   * - 自动续期机制触发
   * - 安全审计和监控
   * - 用户活跃度追踪
   *
   * @param accessToken 访问令牌
   * @returns 验证结果和会话信息
   */
  async validateAccessToken(accessToken: string): Promise<{
    isValid: boolean
    session?: Session
    userId?: string
    shouldRenew?: boolean
  }> {
    try {
      // 验证 JWT 令牌
      await this.commonJwtService.verifyAsync<{
        sub: string
        sessionId: string
        type: string
        iat: number
        exp: number
      }>(accessToken)

      // 查找对应的会话
      const session = await this.sessionRepo.findByAccessToken(accessToken)
      if (!session) {
        return { isValid: false }
      }

      // 验证会话状态
      if (!session.isActive()) {
        return { isValid: false }
      }

      // 检查是否需要自动续期
      const shouldRenew = this.shouldAutoRenew(session)

      // 如果需要续期，自动续期
      if (shouldRenew) {
        await this.autoRenewSession(session)
      }

      return {
        isValid: true,
        session,
        userId: session.getUserId(),
        shouldRenew
      }
    } catch (error) {
      this.logger.warn(
        `Invalid access token: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { isValid: false }
    }
  }

  /**
   * 刷新令牌
   *
   * 使用场景：
   * - 访问令牌过期时的刷新
   * - 长期会话管理
   * - 令牌轮换机制
   * - 安全策略执行
   * - 用户体验优化
   *
   * @param refreshToken 刷新令牌
   * @returns 新的令牌对
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    sessionId: string
  }> {
    try {
      // 验证刷新令牌
      await this.commonJwtService.verifyAsync<{
        sub: string
        sessionId: string
        type: string
        iat: number
        exp: number
      }>(refreshToken)

      // 查找对应的会话
      const session = await this.sessionRepo.findByRefreshToken(refreshToken)
      if (!session || !session.isActive()) {
        throw new Error('Invalid or expired refresh token')
      }

      // 生成新的令牌
      const newAccessToken = await this.generateJwtToken(session, 'ACCESS')
      const newRefreshToken = await this.generateJwtToken(session, 'REFRESH')

      // 更新会话的令牌
      session['props'].accessToken = newAccessToken
      session['props'].refreshToken = newRefreshToken

      // 保存会话
      await this.sessionRepo.save(session)

      this.logger.log(`Refreshed tokens for session ${session.getId()}`)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId: session.getId()
      }
    } catch (error) {
      this.logger.warn(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw new Error('Token refresh failed')
    }
  }

  /**
   * 用户登出
   *
   * 使用场景：
   * - 用户主动登出
   * - 设备丢失处理
   * - 安全事件响应
   * - 会话清理
   *
   * @param sessionId 会话 ID
   * @returns 登出结果
   */
  async logout(sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.sessionRepo.delete(sessionId)
      this.logger.log(`User logged out from session ${sessionId}`)
      return { success: true }
    } catch (error) {
      this.logger.error(
        `Logout failed for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false }
    }
  }

  /**
   * 用户登出所有设备
   *
   * 使用场景：
   * - 用户修改密码后强制重新登录
   * - 安全事件处理
   * - 账户封禁
   * - 批量会话清理
   *
   * @param userId 用户 ID
   * @returns 登出结果
   */
  async logoutAll(userId: string): Promise<{ success: boolean; sessionCount: number }> {
    try {
      const sessions = await this.sessionRepo.findAllByUserId(userId)
      const sessionCount = sessions.length

      await this.sessionRepo.deleteAllByUserId(userId)

      this.logger.log(`User ${userId} logged out from all ${sessionCount} sessions`)
      return { success: true, sessionCount }
    } catch (error) {
      this.logger.error(
        `Logout all failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false, sessionCount: 0 }
    }
  }

  // ==================== 管理员控制方法 ====================

  /**
   * 管理员撤销用户的所有会话
   *
   * 使用场景：
   * - 用户违规处理
   * - 安全事件响应
   * - 账户封禁
   * - 强制用户重新登录
   * - 安全审计
   *
   * @param userId 用户 ID
   * @param reason 撤销原因
   * @param adminId 管理员 ID
   * @returns 撤销结果
   */
  async adminRevokeAllSessions(
    userId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; sessionCount: number }> {
    try {
      await this.sessionRepo.adminRevokeAllByUserId(userId, reason, adminId)
      const sessions = await this.sessionRepo.findAllByUserId(userId)

      this.logger.log(`Admin ${adminId} revoked all sessions for user ${userId}: ${reason}`)
      return { success: true, sessionCount: sessions.length }
    } catch (error) {
      this.logger.error(
        `Admin revoke failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false, sessionCount: 0 }
    }
  }

  /**
   * 管理员撤销指定会话
   *
   * 使用场景：
   * - 可疑设备处理
   * - 特定设备封禁
   * - 精确控制
   * - 安全调查
   *
   * @param sessionId 会话 ID
   * @param reason 撤销原因
   * @param adminId 管理员 ID
   * @returns 撤销结果
   */
  async adminRevokeSession(
    sessionId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean }> {
    try {
      await this.sessionRepo.adminRevokeSession(sessionId, reason, adminId)

      this.logger.log(`Admin ${adminId} revoked session ${sessionId}: ${reason}`)
      return { success: true }
    } catch (error) {
      this.logger.error(
        `Admin revoke session failed for ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false }
    }
  }

  /**
   * 管理员暂停用户的所有会话
   *
   * 使用场景：
   * - 临时封禁用户
   * - 调查期间暂停
   * - 可恢复的处罚
   * - 安全事件处理
   *
   * @param userId 用户 ID
   * @param reason 暂停原因
   * @param adminId 管理员 ID
   * @returns 暂停结果
   */
  async adminSuspendAllSessions(
    userId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; sessionCount: number }> {
    try {
      await this.sessionRepo.adminSuspendAllByUserId(userId, reason, adminId)
      const sessions = await this.sessionRepo.findAllByUserId(userId)

      this.logger.log(`Admin ${adminId} suspended all sessions for user ${userId}: ${reason}`)
      return { success: true, sessionCount: sessions.length }
    } catch (error) {
      this.logger.error(
        `Admin suspend failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false, sessionCount: 0 }
    }
  }

  /**
   * 管理员恢复用户的所有会话
   *
   * 使用场景：
   * - 调查结束后的恢复
   * - 误封后的恢复
   * - 处罚期满后的恢复
   * - 安全事件解决
   *
   * @param userId 用户 ID
   * @returns 恢复结果
   */
  async adminRestoreAllSessions(
    userId: string
  ): Promise<{ success: boolean; sessionCount: number }> {
    try {
      await this.sessionRepo.adminRestoreAllByUserId(userId)
      const sessions = await this.sessionRepo.findAllByUserId(userId)

      this.logger.log(`Admin restored all sessions for user ${userId}`)
      return { success: true, sessionCount: sessions.length }
    } catch (error) {
      this.logger.error(
        `Admin restore failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false, sessionCount: 0 }
    }
  }

  // ==================== 实时控制方法 ====================

  /**
   * 踢出用户的所有其他设备
   *
   * 使用场景：
   * - 新设备登录时踢出旧设备
   * - 安全策略执行
   * - 设备数量限制
   * - 强制单设备登录
   *
   * @param userId 用户 ID
   * @param excludeSessionId 排除的会话 ID
   * @returns 踢出结果
   */
  async kickOtherDevices(
    userId: string,
    excludeSessionId: string
  ): Promise<{ success: boolean; kickedCount: number }> {
    try {
      const sessions = await this.sessionRepo.findAllByUserId(userId)
      const sessionsToKick = sessions.filter((session) => session.getId() !== excludeSessionId)

      for (const session of sessionsToKick) {
        await this.sessionRepo.delete(session.getId())
      }

      this.logger.log(`Kicked ${sessionsToKick.length} other devices for user ${userId}`)
      return { success: true, kickedCount: sessionsToKick.length }
    } catch (error) {
      this.logger.error(
        `Kick other devices failed for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false, kickedCount: 0 }
    }
  }

  /**
   * 踢出指定设备
   *
   * 使用场景：
   * - 可疑设备处理
   * - 设备丢失处理
   * - 精确控制
   * - 安全事件响应
   *
   * @param sessionId 会话 ID
   * @returns 踢出结果
   */
  async kickDevice(sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.sessionRepo.kickDevice(sessionId)

      this.logger.log(`Kicked device session ${sessionId}`)
      return { success: true }
    } catch (error) {
      this.logger.error(
        `Kick device failed for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      return { success: false }
    }
  }

  // ==================== 查询和监控方法 ====================

  /**
   * 获取用户的所有会话
   *
   * 使用场景：
   * - 用户查看自己的登录设备
   * - 管理员查看用户会话状态
   * - 安全审计和调查
   * - 设备管理
   *
   * @param userId 用户 ID
   * @returns 会话列表
   */
  async getUserSessions(userId: string): Promise<{
    sessions: Array<{
      sessionId: string
      deviceInfo: DeviceInfo
      status: string
      createdAt: Date
      lastActiveAt: Date
      expiresAt: Date
    }>
    totalCount: number
    activeCount: number
  }> {
    const sessions = await this.sessionRepo.findAllByUserId(userId)
    const activeSessions = sessions.filter((session) => session.isActive())

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.getId(),
        deviceInfo: session.getDeviceInfo(),
        status: session.getStatus(),
        createdAt: session.getCreatedAt(),
        lastActiveAt: session.getLastActiveAt(),
        expiresAt: session.getExpiresAt()
      })),
      totalCount: sessions.length,
      activeCount: activeSessions.length
    }
  }

  /**
   * 获取会话统计信息
   *
   * 使用场景：
   * - 系统监控面板
   * - 性能分析
   * - 容量规划
   * - 安全审计
   *
   * @returns 统计信息
   */
  async getSessionStats(): Promise<{
    total: number
    active: number
    expired: number
    revoked: number
    suspended: number
  }> {
    return this.sessionRepo.getSessionStats()
  }

  /**
   * 获取用户会话统计信息
   *
   * 使用场景：
   * - 用户行为分析
   * - 安全风险评估
   * - 用户支持
   * - 个性化服务
   *
   * @param userId 用户 ID
   * @returns 用户统计信息
   */
  async getUserSessionStats(userId: string): Promise<{
    total: number
    active: number
    devices: string[]
    lastActiveAt: Date
  }> {
    return this.sessionRepo.getUserSessionStats(userId)
  }

  // ==================== 私有方法 ====================

  /**
   * 检查用户会话数量限制
   *
   * 使用场景：
   * - 防止用户创建过多会话
   * - 资源使用控制
   * - 安全策略执行
   * - 性能优化
   *
   * @param userId 用户 ID
   */
  private async checkSessionLimit(userId: string): Promise<void> {
    const activeCount = await this.sessionRepo.countActiveByUserId(userId)
    if (activeCount >= this.defaultConfig.maxSessionsPerUser) {
      throw new Error(`Session limit exceeded for user ${userId}`)
    }
  }

  /**
   * 生成 JWT 令牌
   *
   * 使用场景：
   * - 创建访问令牌
   * - 创建刷新令牌
   * - 令牌签名和验证
   * - 安全策略应用
   *
   * @param session 会话实体
   * @param type 令牌类型
   * @returns JWT 令牌
   */
  private async generateJwtToken(session: Session, type: 'ACCESS' | 'REFRESH'): Promise<string> {
    const tokenConfig = this.configService.get('token')
    const payload = {
      sub: session.getUserId(),
      sessionId: session.getId(),
      type
    }

    if (type === 'ACCESS') {
      return this.commonJwtService.signAccessToken(payload, {
        issuer: tokenConfig?.issuer,
        audience: tokenConfig?.audience
      })
    } else {
      return this.commonJwtService.signRefreshToken(payload, {
        issuer: tokenConfig?.issuer,
        audience: tokenConfig?.audience
      })
    }
  }

  /**
   * 判断是否需要自动续期
   *
   * 使用场景：
   * - 自动续期机制触发
   * - 用户体验优化
   * - 安全策略执行
   * - 性能优化
   *
   * @param session 会话实体
   * @returns 是否需要续期
   */
  private shouldAutoRenew(session: Session): boolean {
    if (!this.defaultConfig.enableAutoRenewal) {
      return false
    }

    const remainingTime = session.getRemainingTime()
    const renewalThreshold = 300 // 5分钟

    return remainingTime > 0 && remainingTime <= renewalThreshold
  }

  /**
   * 自动续期会话
   *
   * 使用场景：
   * - 用户活跃时的自动续期
   * - 无缝的用户体验
   * - 安全策略调整
   * - 性能优化
   *
   * @param session 会话实体
   */
  private async autoRenewSession(session: Session): Promise<void> {
    const tokenConfig = this.configService.get('token')
    const accessTokenExpiry =
      tokenConfig?.accessTokenValidity || this.defaultConfig.accessTokenExpiry

    session.renewAccessToken(accessTokenExpiry)
    await this.sessionRepo.save(session)

    this.logger.log(`Auto-renewed session ${session.getId()}`)
  }
}
