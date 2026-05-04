import { Session } from '../aggregates/usersession.aggregate'
import { SessionStatus } from '../../common/constants'

/**
 * Session Repository 接口
 *
 * 功能：定义 Session 数据持久化的抽象接口
 *
 * 使用场景：
 * - 提供 Session 数据的 CRUD 操作
 * - 支持多种存储后端（Redis、数据库等）
 * - 实现分布式 Session 管理
 * - 支持多维度查询和索引
 * - 提供管理员控制功能
 * - 支持实时监控和统计
 *
 * 技术特点：
 * - 遵循 DDD 模式
 * - 支持事务操作
 * - 多维度索引查询
 * - 自动过期机制
 * - 批量操作支持
 */
export interface IUserSessionRepository {
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
  findById(sessionId: string): Promise<Session | null>

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
  findByRefreshToken(refreshToken: string): Promise<Session | null>

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
  findActiveByUserId(userId: string): Promise<Session[]>

  /**
   * 查找当前范围内的所有活跃 Session
   *
   * 使用场景：
   * - 管理员在线用户总览
   * - 当前范围在线人数与会话数统计
   * - 平台 / 租户级在线会话聚合
   *
   * @param scope 可选租户范围
   * @returns Promise<Session[]>
   */
  findAllActive(scope?: { tenantId?: string }): Promise<Session[]>

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
  findAllByUserId(userId: string, scope?: { tenantId?: string }): Promise<Session[]>

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
  findByDeviceId(deviceId: string): Promise<Session[]>

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
  findByIpAddress(ipAddress: string): Promise<Session[]>

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
  save(session: Session): Promise<Session>

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
  delete(sessionId: string): Promise<void>

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
  deleteAllByUserId(userId: string): Promise<void>

  /**
   * 删除某个账号上下文下的所有 Session
   *
   * 使用场景：
   * - 当前账号维度的全部退出
   * - 切换账号时替换当前账号会话集合
   * - 账号范围内的安全清理
   *
   * @param accountId 账号 ID
   * @returns Promise<void>
   */
  deleteAllByAccountId(accountId: string): Promise<void>

  /**
   * 删除指定 tenant 下仍处于活动状态的租户范围 Session
   *
   * 使用场景：
   * - tenant 被停用或归档后强制清理该 tenant 的登录态
   * - 只影响 TENANT scope session
   * - 不影响 SYSTEM scope session 或其他 tenant session
   *
   * @param tenantId 租户 ID
   * @returns Promise<number> 删除的 Session 数量
   */
  deleteActiveTenantScopeSessionsByTenantId(tenantId: string): Promise<number>

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
  deleteAllByDeviceId(deviceId: string): Promise<void>

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
  batchUpdateStatus(sessionIds: string[], status: SessionStatus): Promise<void>

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
  deleteExpiredSessions(): Promise<number>

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
  countActiveByUserId(userId: string): Promise<number>

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
  countAll(): Promise<number>

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
  countActive(): Promise<number>

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
  adminRevokeAllByUserId(userId: string, reason: string, adminId: string): Promise<void>

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
  adminRevokeSession(sessionId: string, reason: string, adminId: string): Promise<void>

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
  adminSuspendAllByUserId(userId: string, reason: string, adminId: string): Promise<void>

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
  adminRestoreAllByUserId(userId: string): Promise<void>

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
  kickOtherDevices(userId: string, accountId: string | undefined, excludeSessionId: string): Promise<void>

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
  kickDevice(sessionId: string): Promise<void>

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
  getSessionStats(): Promise<{
    total: number
    active: number
    expired: number
    revoked: number
    suspended: number
  }>

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
  getUserSessionStats(userId: string): Promise<{
    total: number
    active: number
    devices: string[]
    lastActiveAt: Date
  }>
}
