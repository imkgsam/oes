import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService } from '@oes/common/modules/jwt/jwt.service'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
import { SessionService } from './session.service'
import { MfaService } from './mfa.service'
import { DeviceInfo } from 'src/domain/aggregates/usersession.aggregate'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { IIdentityServicePort } from '../ports'
import { LoginResponseDto } from '@oes/common/dtos/auth-service/all.dto'
import { AccountDto } from '@oes/common/dtos/identity-service/all.dto'

/**
 * 认证服务
 *
 * 功能：处理用户登录认证的核心业务逻辑
 *
 * 使用场景：
 * - 用户登录认证
 * - 多种登录方式支持
 * - 会话创建和管理
 * - MFA 验证集成
 * - 设备信息记录
 * - 安全审计
 *
 * 技术特点：
 * - 支持多种认证方式（邮箱密码、OAuth、OTP）
 * - 集成 SessionService 进行会话管理
 * - 集成 MfaService 进行多因素认证
 * - 使用 CommonJwtService 进行令牌处理
 * - 设备信息追踪
 * - 安全日志记录
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly strategyFactory: AuthStrategyFactory,
    private readonly commonJwtService: CommonJwtService,
    private readonly sessionService: SessionService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    private readonly identityService: IIdentityServicePort
  ) {}

  /**
   * 用户登录
   *
   * 使用场景：
   * - 用户首次登录
   * - 多设备登录
   * - 安全认证流程
   * - 会话创建
   * - 设备信息记录
   *
   * @param method 登录方式
   * @param dto 登录数据
   * @param deviceInfo 设备信息
   * @returns 登录结果
   */
  async login<T>(
    method: LoginMethodEnum,
    payload: T,
    deviceInfo?: DeviceInfo
  ): Promise<LoginResponseDto> {
    // 1 选择认证策略
    const strategy = this.strategyFactory.get(method)
    if (!strategy) throw new Error(`Unsupported login method type: ${String(method)}`)

    // 2 认证用户
    const userId = await strategy.authenticate(payload)
    const user = await this.identityService.getUserById(userId)
    if (!user) throw new Error('User not found')

    // 3 检查是否需要 MFA
    const shouldTriggerMfa = await this.mfaService.shouldTriggerMfa(user.id)
    if (shouldTriggerMfa) {
      // 生成 MFA 令牌
      const mfaToken = await this.mfaService.generateOneTimeToken(user.id)
      this.logger.log(`MFA required for user ${user.id}, token generated`)

      // 返回 MFA 挑战信息
      return {
        userId: user.id,
        mfaRequired: true,
        challengeId: mfaToken.tokenId,
        mfaType: mfaToken.type
      }
    }

    // 4 检查是否为多账户
    const accounts: AccountDto[] = await this.identityService.getAccountsByUserId({
      userId: user.id
    })
    const validAccounts: AccountDto[] = accounts.filter((acc) => !acc.isEnable)
    if (validAccounts.length > 1) {
      this.logger.log(`User ${user.id} has multiple accounts, prompting for selection`)
      return {
        multipleAccounts: true,
        userId: user.id,
        accounts: accounts.map((acc) => ({
          accountId: acc.id,
          tenantId: acc.tenantId,
          displayName: `${acc.userId} / ${acc.tenantId}`
        }))
      }
    } else if (validAccounts.length === 0) {
      throw new BadRequestException('No valid accounts found for user')
    }

    // 5 创建会话
    const selectedAccount = validAccounts[0]
    const sessionResult = await this.sessionService.createSession(
      user.id,
      selectedAccount.id,
      deviceInfo
    )
    this.logger.log(
      `User ${user.id} logged in successfully with session ${sessionResult.sessionId}`
    )
    return {
      userId: user.id,
      mfaRequired: false,
      accessToken: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      accountId: selectedAccount.id,
      tenantId: selectedAccount.tenantId
    }
  }

  /**
   * MFA 验证后，再选择账户登录
   *
   * 使用场景：
   * - MFA 验证流程
   * - 完成登录过程
   * - 安全验证
   * - 会话创建
   *
   * @param mfaTokenId MFA 令牌 ID
   * @param mfaCode MFA 验证码
   * @param deviceInfo 设备信息
   * @returns 登录结果
   */
  async loginAfterMfa(
    mfaTokenId: string,
    mfaCode: string,
    deviceInfo: DeviceInfo
  ): Promise<LoginResponseDto> {
    this.logger.log(`MFA verification for token ${mfaTokenId}`)

    // 1 验证 MFA 代码
    const userId = await this.mfaService.verifyMfaCode(mfaTokenId, mfaCode)
    if (!userId) {
      throw new BadRequestException('Invalid MFA code')
    }

    // 2 检查是否为多账户
    const accounts: AccountDto[] = await this.identityService.getAccountsByUserId({
      userId: userId
    })
    const validAccounts: AccountDto[] = accounts.filter((acc) => !acc.isEnable)
    if (validAccounts.length > 1) {
      this.logger.log(`User ${userId} has multiple accounts, prompting for selection`)
      return {
        multipleAccounts: true,
        userId: userId,
        accounts: accounts.map((acc) => ({
          accountId: acc.id,
          tenantId: acc.tenantId,
          displayName: `${acc.userId} / ${acc.tenantId}`
        }))
      }
    } else if (validAccounts.length === 0) {
      throw new BadRequestException('No valid accounts found for user')
    }

    // 3 创建会话
    const selectedAccount = validAccounts[0]
    const sessionResult = await this.sessionService.createSession(
      userId,
      selectedAccount.id,
      deviceInfo
    )
    this.logger.log(`User ${userId} logged in successfully with session ${sessionResult.sessionId}`)
    return {
      userId: userId,
      mfaRequired: false,
      accessToken: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      accountId: selectedAccount.id,
      tenantId: selectedAccount.tenantId
    }
  }

  async loginAfterAccountSelect(
    userId: string,
    accountId: string,
    deviceInfo: DeviceInfo
  ): Promise<LoginResponseDto> {
    this.logger.log(`Account selection login for user ${userId}, account ${accountId}`)

    // 1 检查用户有效性
    const user = await this.identityService.getUserById({ userId: userId })
    if (!user) throw new Error('User not found')

    // 2 检查账户有效性
    const account = await this.identityService.getAccountById({ accountId: accountId })
    if (!account || account.userId !== user.id || account.isEnable) {
      throw new BadRequestException('Invalid account selection')
    }

    // 3 创建会话
    const sessionResult = await this.sessionService.createSession(userId, account.id, deviceInfo)
    this.logger.log(`User ${userId} logged in successfully with session ${sessionResult.sessionId}`)
    return {
      userId: userId,
      mfaRequired: false,
      accessToken: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      accountId: account.id,
      tenantId: account.tenantId
    }
  }

  /**
   * 刷新令牌
   *
   * 使用场景：
   * - 访问令牌过期时的刷新
   * - 长期会话维护
   * - 用户体验优化
   * - 安全令牌轮换
   *
   * @param refreshToken 刷新令牌
   * @returns 新的令牌对
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    sessionId: string
  }> {
    this.logger.log('Token refresh attempt')

    const result = await this.sessionService.refreshTokens(refreshToken)

    this.logger.log(`Tokens refreshed for session ${result.sessionId}`)

    return result
  }

  /**
   * 用户登出
   *
   * 使用场景：
   * - 用户主动登出
   * - 安全事件响应
   * - 会话清理
   * - 设备管理
   *
   * @param sessionId 会话 ID
   * @returns 登出结果
   */
  async logout(sessionId: string): Promise<{ success: boolean }> {
    this.logger.log(`User logout for session ${sessionId}`)

    const result = await this.sessionService.logout(sessionId)

    if (result.success) {
      this.logger.log(`User logged out successfully from session ${sessionId}`)
    } else {
      this.logger.warn(`Logout failed for session ${sessionId}`)
    }

    return result
  }

  /**
   * 用户登出所有设备
   *
   * 使用场景：
   * - 密码修改后的强制重新登录
   * - 安全事件处理
   * - 账户封禁
   * - 批量会话清理
   *
   * @param userId 用户 ID
   * @returns 登出结果
   */
  async logoutAll(userId: string): Promise<{ success: boolean; sessionCount: number }> {
    this.logger.log(`User ${userId} logout from all devices`)

    const result = await this.sessionService.logoutAll(userId)

    if (result.success) {
      this.logger.log(`User ${userId} logged out from all ${result.sessionCount} sessions`)
    } else {
      this.logger.warn(`Logout all failed for user ${userId}`)
    }

    return result
  }

  /**
   * 验证访问令牌
   *
   * 使用场景：
   * - API 请求时的令牌验证
   * - 获取用户会话信息
   * - 自动续期机制
   * - 安全审计
   *
   * @param accessToken 访问令牌
   * @returns 验证结果
   */
  async validateAccessToken(accessToken: string): Promise<{
    isValid: boolean
    userId?: string
    sessionId?: string
    shouldRenew?: boolean
  }> {
    const result = await this.sessionService.validateAccessToken(accessToken)

    if (result.isValid) {
      this.logger.debug(`Token validated for user ${result.userId}`)
    } else {
      this.logger.warn('Invalid access token provided')
    }

    return {
      isValid: result.isValid,
      userId: result.userId,
      sessionId: result.session?.getId(),
      shouldRenew: result.shouldRenew
    }
  }

  /**
   * 获取用户会话信息
   *
   * 使用场景：
   * - 用户查看登录设备
   * - 管理员查看用户状态
   * - 安全审计
   * - 设备管理
   *
   * @param userId 用户 ID
   * @returns 会话信息
   */
  async getUserSessions(userId: string) {
    this.logger.log(`Getting sessions for user ${userId}`)

    return this.sessionService.getUserSessions(userId)
  }

  // ==================== 管理员控制方法 ====================

  /**
   * 管理员撤销用户所有会话
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
   * @returns 撤销结果
   */
  async adminRevokeAllSessions(
    userId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; sessionCount: number }> {
    this.logger.log(`Admin ${adminId} revoking all sessions for user ${userId}: ${reason}`)

    const result = await this.sessionService.adminRevokeAllSessions(userId, reason, adminId)

    if (result.success) {
      this.logger.log(`Admin ${adminId} revoked ${result.sessionCount} sessions for user ${userId}`)
    } else {
      this.logger.error(`Admin revoke failed for user ${userId}`)
    }

    return result
  }

  /**
   * 管理员踢出指定设备
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
  async adminKickDevice(sessionId: string): Promise<{ success: boolean }> {
    this.logger.log(`Admin kicking device session ${sessionId}`)

    const result = await this.sessionService.kickDevice(sessionId)

    if (result.success) {
      this.logger.log(`Admin kicked device session ${sessionId}`)
    } else {
      this.logger.error(`Admin kick device failed for session ${sessionId}`)
    }
    return result
  }

  // ================================= private helper functions ================================
}
