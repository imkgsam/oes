import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { Session } from 'src/domain/aggregates/usersession.aggregate'
import { SessionStatus } from '@oes/common/constants/const/auth-service.const'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'

/**
 * Redis Session Repository
 *
 * 功能：基于 Redis 的 Session 数据持久化实现
 *
 * 使用场景：
 * - 高性能的 Session 存储和检索
 * - 支持分布式部署的 Session 管理
 * - 自动过期和清理机制
 * - 多设备 Session 管理
 *
 * 技术特点：
 * - 使用 Redis 作为存储后端
 * - 支持 Session 自动过期
 * - 多维度索引（用户、设备、IP）
 * - 事务保证数据一致性
 */
@Injectable()
export class RedisUserSessionRepository implements IUserSessionRepository {
  private readonly SESSION_PREFIX = 'session:'
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:'
  private readonly DEVICE_SESSIONS_PREFIX = 'device_sessions:'
  private readonly IP_SESSIONS_PREFIX = 'ip_sessions:'
  private readonly ACCESS_TOKEN_PREFIX = 'access_token:'
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:'
  private readonly redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    })
  }

  // ==================== 查询方法 ====================

  /**
   * 根据 Session ID 查找
   *
   * 使用场景：
   * - 验证特定 Session 的存在性
   * - 获取 Session 详细信息
   * - 管理员查看特定 Session
   * - 调试和审计目的
   *
   * @param sessionId Session ID
   * @returns Promise<Session | null>
   */
  async findById(sessionId: string): Promise<Session | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`
    const data = await this.redis.get(key)
    if (!data) return null
    return Session.fromRedis(JSON.parse(data))
  }

  /**
   * 根据访问令牌查找
   *
   * 使用场景：
   * - API 请求时的令牌验证
   * - 获取令牌对应的 Session 信息
   * - 自动续期时的 Session 查找
   * - 安全审计和监控
   *
   * @param accessToken 访问令牌
   * @returns Promise<Session | null>
   */
  async findByAccessToken(accessToken: string): Promise<Session | null> {
    const sessionId = await this.redis.get(`${this.ACCESS_TOKEN_PREFIX}${accessToken}`)
    if (!sessionId) return null
    return this.findById(sessionId)
  }

  /**
   * 根据刷新令牌查找
   *
   * 使用场景：
   * - 刷新令牌时的验证
   * - 获取刷新令牌对应的 Session
   * - 令牌轮换时的 Session 更新
   * - 长期会话管理
   *
   * @param refreshToken 刷新令牌
   * @returns Promise<Session | null>
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const sessionId = await this.redis.get(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`)
    if (!sessionId) return null
    return this.findById(sessionId)
  }

  /**
   * 查找用户的所有活跃 Session
   *
   * 使用场景：
   * - 用户查看自己的登录设备
   * - 管理员查看用户活跃状态
   * - 设备数量限制检查
   * - 安全审计和监控
   *
   * @param userId 用户 ID
   * @returns Promise<Session[]>
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`${this.USER_SESSIONS_PREFIX}${userId}`)
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session && session.isActive()) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * 查找用户的所有 Session（包括非活跃）
   *
   * 使用场景：
   * - 管理员查看用户完整登录历史
   * - 安全审计和调查
   * - 批量操作（如撤销所有 Session）
   * - 数据分析和统计
   *
   * @param userId 用户 ID
   * @returns Promise<Session[]>
   */
  async findAllByUserId(userId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`${this.USER_SESSIONS_PREFIX}${userId}`)
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * 查找设备的所有 Session
   *
   * 使用场景：
   * - 设备丢失处理
   * - 可疑设备调查
   * - 设备级别的安全控制
   * - 跨用户设备追踪
   *
   * @param deviceId 设备 ID
   * @returns Promise<Session[]>
   */
  async findByDeviceId(deviceId: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`${this.DEVICE_SESSIONS_PREFIX}${deviceId}`)
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * 查找 IP 地址的所有 Session
   *
   * 使用场景：
   * - 异常 IP 检测
   * - 地理位置安全控制
   * - 网络级别的安全审计
   * - 分布式攻击检测
   *
   * @param ipAddress IP 地址
   * @returns Promise<Session[]>
   */
  async findByIpAddress(ipAddress: string): Promise<Session[]> {
    const sessionIds = await this.redis.smembers(`${this.IP_SESSIONS_PREFIX}${ipAddress}`)
    const sessions: Session[] = []

    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    return sessions
  }

  // ==================== 保存方法 ====================

  /**
   * 保存 Session（创建或更新）
   *
   * 使用场景：
   * - 创建新的用户登录 Session
   * - 更新 Session 状态（如续期、暂停）
   * - 管理员操作后的 Session 更新
   * - 设备信息更新
   *
   * @param session Session 实体
   * @returns Promise<Session>
   */
  async save(session: Session): Promise<Session> {
    const sessionData = session.toRedis()
    const sessionKey = `${this.SESSION_PREFIX}${session.getId()}`
    const userId = session.getUserId()
    const deviceId = session.getDeviceInfo().deviceId
    const ipAddress = session.getDeviceInfo().ipAddress

    // 使用 Redis 事务确保数据一致性
    const multi = this.redis.multi()

    // 保存 Session 数据
    multi.set(sessionKey, JSON.stringify(sessionData))
    multi.expire(sessionKey, this.getSessionTTL(session))

    // 设置访问令牌索引
    multi.set(`${this.ACCESS_TOKEN_PREFIX}${session.getAccessToken()}`, session.getId())
    multi.expire(
      `${this.ACCESS_TOKEN_PREFIX}${session.getAccessToken()}`,
      this.getSessionTTL(session)
    )

    // 设置刷新令牌索引
    multi.set(`${this.REFRESH_TOKEN_PREFIX}${session.getRefreshToken()}`, session.getId())
    multi.expire(
      `${this.REFRESH_TOKEN_PREFIX}${session.getRefreshToken()}`,
      this.getRefreshTTL(session)
    )

    // 添加到用户 Session 集合
    multi.sadd(`${this.USER_SESSIONS_PREFIX}${userId}`, session.getId())

    // 添加到设备 Session 集合
    multi.sadd(`${this.DEVICE_SESSIONS_PREFIX}${deviceId}`, session.getId())

    // 添加到 IP Session 集合
    multi.sadd(`${this.IP_SESSIONS_PREFIX}${ipAddress}`, session.getId())

    await multi.exec()

    return session
  }

  // ==================== 删除方法 ====================

  /**
   * 删除 Session
   *
   * 使用场景：
   * - 用户主动登出
   * - 管理员强制登出
   * - 设备丢失处理
   * - 安全事件响应
   *
   * @param sessionId Session ID
   * @returns Promise<void>
   */
  async delete(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId)
    if (!session) return

    const userId = session.getUserId()
    const deviceId = session.getDeviceInfo().deviceId
    const ipAddress = session.getDeviceInfo().ipAddress

    const multi = this.redis.multi()

    // 删除 Session 数据
    multi.del(`${this.SESSION_PREFIX}${sessionId}`)

    // 删除令牌索引
    multi.del(`${this.ACCESS_TOKEN_PREFIX}${session.getAccessToken()}`)
    multi.del(`${this.REFRESH_TOKEN_PREFIX}${session.getRefreshToken()}`)

    // 从集合中移除
    multi.srem(`${this.USER_SESSIONS_PREFIX}${userId}`, sessionId)
    multi.srem(`${this.DEVICE_SESSIONS_PREFIX}${deviceId}`, sessionId)
    multi.srem(`${this.IP_SESSIONS_PREFIX}${ipAddress}`, sessionId)

    await multi.exec()
  }

  /**
   * 删除用户的所有 Session
   *
   * 使用场景：
   * - 用户修改密码后强制重新登录
   * - 管理员强制用户下线
   * - 安全事件处理
   * - 账户封禁
   *
   * @param userId 用户 ID
   * @returns Promise<void>
   */
  async deleteAllByUserId(userId: string): Promise<void> {
    const sessions = await this.findAllByUserId(userId)
    const multi = this.redis.multi()

    for (const session of sessions) {
      const deviceId = session.getDeviceInfo().deviceId
      const ipAddress = session.getDeviceInfo().ipAddress

      multi.del(`${this.SESSION_PREFIX}${session.getId()}`)
      multi.del(`${this.ACCESS_TOKEN_PREFIX}${session.getAccessToken()}`)
      multi.del(`${this.REFRESH_TOKEN_PREFIX}${session.getRefreshToken()}`)
      multi.srem(`${this.DEVICE_SESSIONS_PREFIX}${deviceId}`, session.getId())
      multi.srem(`${this.IP_SESSIONS_PREFIX}${ipAddress}`, session.getId())
    }

    multi.del(`${this.USER_SESSIONS_PREFIX}${userId}`)
    await multi.exec()
  }

  /**
   * 删除设备的所有 Session
   *
   * 使用场景：
   * - 设备丢失处理
   * - 可疑设备清理
   * - 设备级别的安全控制
   * - 设备重置
   *
   * @param deviceId 设备 ID
   * @returns Promise<void>
   */
  async deleteAllByDeviceId(deviceId: string): Promise<void> {
    const sessions = await this.findByDeviceId(deviceId)
    const multi = this.redis.multi()

    for (const session of sessions) {
      const userId = session.getUserId()
      const ipAddress = session.getDeviceInfo().ipAddress

      multi.del(`${this.SESSION_PREFIX}${session.getId()}`)
      multi.del(`${this.ACCESS_TOKEN_PREFIX}${session.getAccessToken()}`)
      multi.del(`${this.REFRESH_TOKEN_PREFIX}${session.getRefreshToken()}`)
      multi.srem(`${this.USER_SESSIONS_PREFIX}${userId}`, session.getId())
      multi.srem(`${this.IP_SESSIONS_PREFIX}${ipAddress}`, session.getId())
    }

    multi.del(`${this.DEVICE_SESSIONS_PREFIX}${deviceId}`)
    await multi.exec()
  }

  // ==================== 批量操作方法 ====================

  /**
   * 批量更新 Session 状态
   *
   * 使用场景：
   * - 批量暂停用户 Session
   * - 批量恢复用户 Session
   * - 系统维护时的状态更新
   * - 安全策略批量应用
   *
   * @param sessionIds Session ID 列表
   * @param status 新状态
   * @returns Promise<void>
   */
  async batchUpdateStatus(sessionIds: string[], status: SessionStatus): Promise<void> {
    const multi = this.redis.multi()

    for (const sessionId of sessionIds) {
      const session = await this.findById(sessionId)
      if (session) {
        // 更新 Session 状态
        const sessionData = session.toRedis()
        sessionData.status = status
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`
        multi.set(sessionKey, JSON.stringify(sessionData))
      }
    }

    await multi.exec()
  }

  /**
   * 批量删除过期 Session
   *
   * 使用场景：
   * - 定期清理任务
   * - 内存优化
   * - 系统维护
   * - 性能优化
   *
   * @returns Promise<number> 删除的数量
   */
  async deleteExpiredSessions(): Promise<number> {
    // 这里需要扫描所有 Session，实际项目中可能需要使用 Redis 的 SCAN 命令
    // 或者使用定时任务来清理过期 Session
    let deletedCount = 0
    const pattern = `${this.SESSION_PREFIX}*`
    const keys = await this.redis.keys(pattern)

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        const session = Session.fromRedis(JSON.parse(data))
        if (session.isExpired() && session.isRefreshExpired()) {
          await this.delete(session.getId())
          deletedCount++
        }
      }
    }

    return deletedCount
  }

  // ==================== 统计方法 ====================

  /**
   * 获取用户活跃 Session 数量
   *
   * 使用场景：
   * - 设备数量限制检查
   * - 用户活跃度统计
   * - 系统负载监控
   * - 安全策略应用
   *
   * @param userId 用户 ID
   * @returns Promise<number>
   */
  async countActiveByUserId(userId: string): Promise<number> {
    const sessions = await this.findActiveByUserId(userId)
    return sessions.length
  }

  /**
   * 获取总 Session 数量
   *
   * 使用场景：
   * - 系统容量监控
   * - 性能分析
   * - 资源使用统计
   * - 系统健康检查
   *
   * @returns Promise<number>
   */
  async countAll(): Promise<number> {
    const pattern = `${this.SESSION_PREFIX}*`
    const keys = await this.redis.keys(pattern)
    return keys.length
  }

  /**
   * 获取活跃 Session 数量
   *
   * 使用场景：
   * - 系统活跃度监控
   * - 性能分析
   * - 容量规划
   * - 实时统计
   *
   * @returns Promise<number>
   */
  async countActive(): Promise<number> {
    const pattern = `${this.SESSION_PREFIX}*`
    const keys = await this.redis.keys(pattern)
    let activeCount = 0

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        const session = Session.fromRedis(JSON.parse(data))
        if (session.isActive()) {
          activeCount++
        }
      }
    }

    return activeCount
  }

  // ==================== 管理员控制方法 ====================

  /**
   * 管理员撤销用户的所有 Session
   *
   * 使用场景：
   * - 用户违规处理
   * - 安全事件响应
   * - 账户封禁
   * - 强制重新登录
   *
   * @param userId 用户 ID
   * @param reason 撤销原因
   * @param adminId 管理员 ID
   * @returns Promise<void>
   */
  async adminRevokeAllByUserId(userId: string, reason: string, adminId: string): Promise<void> {
    const sessions = await this.findAllByUserId(userId)
    const multi = this.redis.multi()

    for (const session of sessions) {
      session.adminRevoke(reason, adminId)
      const sessionKey = `${this.SESSION_PREFIX}${session.getId()}`
      multi.set(sessionKey, JSON.stringify(session.toRedis()))
    }

    await multi.exec()
  }

  /**
   * 管理员撤销指定 Session
   *
   * 使用场景：
   * - 可疑设备处理
   * - 特定设备封禁
   * - 精确控制
   * - 安全调查
   *
   * @param sessionId Session ID
   * @param reason 撤销原因
   * @param adminId 管理员 ID
   * @returns Promise<void>
   */
  async adminRevokeSession(sessionId: string, reason: string, adminId: string): Promise<void> {
    const session = await this.findById(sessionId)
    if (session) {
      session.adminRevoke(reason, adminId)
      await this.save(session)
    }
  }

  /**
   * 管理员暂停用户的所有 Session
   *
   * 使用场景：
   * - 临时封禁
   * - 调查期间暂停
   * - 可恢复的处罚
   * - 安全事件处理
   *
   * @param userId 用户 ID
   * @param reason 暂停原因
   * @param adminId 管理员 ID
   * @returns Promise<void>
   */
  async adminSuspendAllByUserId(userId: string, reason: string, adminId: string): Promise<void> {
    const sessions = await this.findAllByUserId(userId)
    const multi = this.redis.multi()

    for (const session of sessions) {
      session.adminSuspend(reason, adminId)
      const sessionKey = `${this.SESSION_PREFIX}${session.getId()}`
      multi.set(sessionKey, JSON.stringify(session.toRedis()))
    }

    await multi.exec()
  }

  /**
   * 管理员恢复用户的所有 Session
   *
   * 使用场景：
   * - 调查结束后的恢复
   * - 误封后的恢复
   * - 处罚期满后的恢复
   * - 安全事件解决
   *
   * @param userId 用户 ID
   * @returns Promise<void>
   */
  async adminRestoreAllByUserId(userId: string): Promise<void> {
    const sessions = await this.findAllByUserId(userId)
    const multi = this.redis.multi()

    for (const session of sessions) {
      session.restore()
      const sessionKey = `${this.SESSION_PREFIX}${session.getId()}`
      multi.set(sessionKey, JSON.stringify(session.toRedis()))
    }

    await multi.exec()
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
   * @param excludeSessionId 排除的 Session ID
   * @returns Promise<void>
   */
  async kickOtherDevices(userId: string, excludeSessionId: string): Promise<void> {
    const sessions = await this.findAllByUserId(userId)
    const sessionsToKick = sessions.filter((session) => session.getId() !== excludeSessionId)

    for (const session of sessionsToKick) {
      await this.delete(session.getId())
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
   * @param sessionId Session ID
   * @returns Promise<void>
   */
  async kickDevice(sessionId: string): Promise<void> {
    await this.delete(sessionId)
  }

  // ==================== 监控方法 ====================

  /**
   * 获取 Session 统计信息
   *
   * 使用场景：
   * - 系统监控面板
   * - 性能分析
   * - 容量规划
   * - 安全审计
   *
   * @returns Promise<{
   *   total: number
   *   active: number
   *   expired: number
   *   revoked: number
   *   suspended: number
   * }>
   */
  async getSessionStats(): Promise<{
    total: number
    active: number
    expired: number
    revoked: number
    suspended: number
  }> {
    const pattern = `${this.SESSION_PREFIX}*`
    const keys = await this.redis.keys(pattern)
    let total = 0
    let active = 0
    let expired = 0
    let revoked = 0
    let suspended = 0

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        const session = Session.fromRedis(JSON.parse(data))
        total++

        if (session.isActive()) {
          active++
        } else if (session.isExpired()) {
          expired++
        } else if (session.getStatus() === SessionStatus.REVOKED) {
          revoked++
        } else if (session.getStatus() === SessionStatus.SUSPENDED) {
          suspended++
        }
      }
    }

    return { total, active, expired, revoked, suspended }
  }

  /**
   * 获取用户 Session 统计信息
   *
   * 使用场景：
   * - 用户行为分析
   * - 安全风险评估
   * - 用户支持
   * - 个性化服务
   *
   * @param userId 用户 ID
   * @returns Promise<{
   *   total: number
   *   active: number
   *   devices: string[]
   *   lastActiveAt: Date
   * }>
   */
  async getUserSessionStats(userId: string): Promise<{
    total: number
    active: number
    devices: string[]
    lastActiveAt: Date
  }> {
    const sessions = await this.findAllByUserId(userId)
    const devices = [...new Set(sessions.map((s) => s.getDeviceInfo().deviceId))]
    const lastActiveAt = sessions.reduce((latest, session) => {
      return session.getLastActiveAt() > latest ? session.getLastActiveAt() : latest
    }, new Date(0))

    return {
      total: sessions.length,
      active: sessions.filter((s) => s.isActive()).length,
      devices,
      lastActiveAt
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取 Session TTL（生存时间）
   *
   * @param session Session 实体
   * @returns number TTL 秒数
   */
  private getSessionTTL(session: Session): number {
    return Math.max(0, Math.floor((session.getExpiresAt().getTime() - Date.now()) / 1000))
  }

  /**
   * 获取刷新令牌 TTL（生存时间）
   *
   * @param session Session 实体
   * @returns number TTL 秒数
   */
  private getRefreshTTL(session: Session): number {
    return Math.max(0, Math.floor((session.getRefreshExpiresAt().getTime() - Date.now()) / 1000))
  }
}
