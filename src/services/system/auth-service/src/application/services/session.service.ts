import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService } from '@oes/common/auth'
import { Session, SessionConfig, DeviceInfo } from 'src/domain/aggregates/usersession.aggregate'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
import { SESSION_REPOSITORY } from 'src/common/constants/injection-tokens'

/**
 * Session 鏈嶅姟
 *
 * 鍔熻兘锛氱鐞嗙敤鎴蜂細璇濈殑鏍稿績涓氬姟閫昏緫
 *
 * 浣跨敤鍦烘櫙锛? * - 鐢ㄦ埛鐧诲綍鍚庣殑浼氳瘽鍒涘缓鍜岀鐞? * - 鍙屼护鐗岋紙璁块棶浠ょ墝 + 鍒锋柊浠ょ墝锛夋満鍒? * - 鑷姩缁湡鍜屼护鐗岃疆鎹? * - 绠＄悊鍛樺浼氳瘽鐨勫疄鏃舵帶鍒? * - 璁惧绾у埆鐨勪細璇濈鐞? * - 瀹夊叏瀹¤鍜岀洃鎺? *
 * 鎶€鏈壒鐐癸細
 * - 闆嗘垚 CommonJwtService 杩涜浠ょ墝鐢熸垚
 * - 浣跨敤 TokenConfig 杩涜閰嶇疆绠＄悊
 * - 鏀寔鑷姩缁湡鏈哄埗
 * - 澶氱淮搴﹀畨鍏ㄦ帶鍒? * - 瀹炴椂鐩戞帶鍜岀粺璁? */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)
  private readonly defaultConfig: SessionConfig = {
    accessTokenExpiry: 3600, // 1灏忔椂
    refreshTokenExpiry: 7 * 24 * 3600, // 7澶?    maxSessionsPerUser: 5,
    enableAutoRenewal: true,
    enableDeviceTracking: true
  }

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: IUserSessionRepository,
    private readonly commonJwtService: CommonJwtService,
    private readonly configService: ConfigService
  ) {}

  // ==================== 鏍稿績鏂规硶 ====================

  /**
   * 鍒涘缓鏂扮殑鐢ㄦ埛浼氳瘽
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛棣栨鐧诲綍鏃跺垱寤轰細璇?   * - 鏂拌澶囩櫥褰曟椂鍒涘缓浼氳瘽
   * - 浠ょ墝鍒锋柊鏃跺垱寤烘柊浼氳瘽
   * - 绠＄悊鍛樹负鐢ㄦ埛鍒涘缓浼氳瘽
   * - 澶氳澶囩櫥褰曠鐞?   *
   * @param userId 鐢ㄦ埛 ID
   * @param deviceInfo 璁惧淇℃伅
   * @param config 浼氳瘽閰嶇疆锛堝彲閫夛級
   * @returns 鍒涘缓鐨勪細璇濅俊鎭?   */
  async createSession(
    userId: string,
    accountId: string,
    deviceInfo: DeviceInfo,
    config?: Partial<SessionConfig>
  ): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
    // 妫€鏌ヤ細璇濇暟閲忛檺鍒?    await this.checkSessionLimit(userId)

    // 鑾峰彇浠ょ墝閰嶇疆
    const tokenConfig = this.configService.getOrThrow('token')
    const accessTokenExpiry =
      tokenConfig?.accessTokenValidity || this.defaultConfig.accessTokenExpiry
    const refreshTokenExpiry =
      tokenConfig?.refreshTokenValidity || this.defaultConfig.refreshTokenExpiry

    // 鍚堝苟閰嶇疆
    const sessionConfig: SessionConfig = {
      ...this.defaultConfig,
      accessTokenExpiry,
      refreshTokenExpiry,
      ...config
    }

    // 鍒涘缓浼氳瘽瀹炰綋
    const session = Session.createSession({
      userId,
      accountId,
      deviceInfo,
      config: sessionConfig
    })

    // 鐢熸垚 JWT 浠ょ墝
    const accessToken = await this.generateJwtToken(session, 'ACCESS')
    const refreshToken = await this.generateJwtToken(session, 'REFRESH')

    // 鏇存柊浼氳瘽鐨勪护鐗?    session['props'].accessToken = accessToken
    session['props'].refreshToken = refreshToken

    // 淇濆瓨浼氳瘽
    await this.sessionRepo.save(session)

    this.logger.log(`Created session for user ${userId} on device ${deviceInfo.deviceId}`)

    return {
      accessToken,
      refreshToken,
      sessionId: session.getId()
    }
  }

  /**
   * 楠岃瘉璁块棶浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - API 璇锋眰鏃剁殑浠ょ墝楠岃瘉
   * - 鑾峰彇浠ょ墝瀵瑰簲鐨勪細璇濅俊鎭?   * - 鑷姩缁湡鏈哄埗瑙﹀彂
   * - 瀹夊叏瀹¤鍜岀洃鎺?   * - 鐢ㄦ埛娲昏穬搴﹁拷韪?   *
   * @param accessToken 璁块棶浠ょ墝
   * @returns 楠岃瘉缁撴灉鍜屼細璇濅俊鎭?   */
  async validateAccessToken(accessToken: string): Promise<{
    isValid: boolean
    session?: Session
    userId?: string
    shouldRenew?: boolean
  }> {
    try {
      // 楠岃瘉 JWT 浠ょ墝
      await this.commonJwtService.verifyAsync<{
        sub: string
        sessionId: string
        type: string
        iat: number
        exp: number
      }>(accessToken)

      // 鏌ユ壘瀵瑰簲鐨勪細璇?      const session = await this.sessionRepo.findByAccessToken(accessToken)
      if (!session) {
        return { isValid: false }
      }

      // 楠岃瘉浼氳瘽鐘舵€?      if (!session.isActive()) {
        return { isValid: false }
      }

      // 妫€鏌ユ槸鍚﹂渶瑕佽嚜鍔ㄧ画鏈?      const shouldRenew = this.shouldAutoRenew(session)

      // 濡傛灉闇€瑕佺画鏈燂紝鑷姩缁湡
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
   * 鍒锋柊浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 璁块棶浠ょ墝杩囨湡鏃剁殑鍒锋柊
   * - 闀挎湡浼氳瘽绠＄悊
   * - 浠ょ墝杞崲鏈哄埗
   * - 瀹夊叏绛栫暐鎵ц
   * - 鐢ㄦ埛浣撻獙浼樺寲
   *
   * @param refreshToken 鍒锋柊浠ょ墝
   * @returns 鏂扮殑浠ょ墝瀵?   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    sessionId: string
  }> {
    try {
      // 楠岃瘉鍒锋柊浠ょ墝
      await this.commonJwtService.verifyAsync<{
        sub: string
        sessionId: string
        type: string
        iat: number
        exp: number
      }>(refreshToken)

      // 鏌ユ壘瀵瑰簲鐨勪細璇?      const session = await this.sessionRepo.findByRefreshToken(refreshToken)
      if (!session || !session.isActive()) {
        throw new Error('Invalid or expired refresh token')
      }

      // 鐢熸垚鏂扮殑浠ょ墝
      const newAccessToken = await this.generateJwtToken(session, 'ACCESS')
      const newRefreshToken = await this.generateJwtToken(session, 'REFRESH')

      // 鏇存柊浼氳瘽鐨勪护鐗?      session['props'].accessToken = newAccessToken
      session['props'].refreshToken = newRefreshToken

      // 淇濆瓨浼氳瘽
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
   * 鐢ㄦ埛鐧诲嚭
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛涓诲姩鐧诲嚭
   * - 璁惧涓㈠け澶勭悊
   * - 瀹夊叏浜嬩欢鍝嶅簲
   * - 浼氳瘽娓呯悊
   *
   * @param sessionId 浼氳瘽 ID
   * @returns 鐧诲嚭缁撴灉
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
   * 鐢ㄦ埛鐧诲嚭鎵€鏈夎澶?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛淇敼瀵嗙爜鍚庡己鍒堕噸鏂扮櫥褰?   * - 瀹夊叏浜嬩欢澶勭悊
   * - 璐︽埛灏佺
   * - 鎵归噺浼氳瘽娓呯悊
   *
   * @param userId 鐢ㄦ埛 ID
   * @returns 鐧诲嚭缁撴灉
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

  // ==================== 绠＄悊鍛樻帶鍒舵柟娉?====================

  /**
   * 绠＄悊鍛樻挙閿€鐢ㄦ埛鐨勬墍鏈変細璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛杩濊澶勭悊
   * - 瀹夊叏浜嬩欢鍝嶅簲
   * - 璐︽埛灏佺
   * - 寮哄埗鐢ㄦ埛閲嶆柊鐧诲綍
   * - 瀹夊叏瀹¤
   *
   * @param userId 鐢ㄦ埛 ID
   * @param reason 鎾ら攢鍘熷洜
   * @param adminId 绠＄悊鍛?ID
   * @returns 鎾ら攢缁撴灉
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
   * 绠＄悊鍛樻挙閿€鎸囧畾浼氳瘽
   *
   * 浣跨敤鍦烘櫙锛?   * - 鍙枒璁惧澶勭悊
   * - 鐗瑰畾璁惧灏佺
   * - 绮剧‘鎺у埗
   * - 瀹夊叏璋冩煡
   *
   * @param sessionId 浼氳瘽 ID
   * @param reason 鎾ら攢鍘熷洜
   * @param adminId 绠＄悊鍛?ID
   * @returns 鎾ら攢缁撴灉
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
   * 绠＄悊鍛樻殏鍋滅敤鎴风殑鎵€鏈変細璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 涓存椂灏佺鐢ㄦ埛
   * - 璋冩煡鏈熼棿鏆傚仠
   * - 鍙仮澶嶇殑澶勭綒
   * - 瀹夊叏浜嬩欢澶勭悊
   *
   * @param userId 鐢ㄦ埛 ID
   * @param reason 鏆傚仠鍘熷洜
   * @param adminId 绠＄悊鍛?ID
   * @returns 鏆傚仠缁撴灉
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
   * 绠＄悊鍛樻仮澶嶇敤鎴风殑鎵€鏈変細璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 璋冩煡缁撴潫鍚庣殑鎭㈠
   * - 璇皝鍚庣殑鎭㈠
   * - 澶勭綒鏈熸弧鍚庣殑鎭㈠
   * - 瀹夊叏浜嬩欢瑙ｅ喅
   *
   * @param userId 鐢ㄦ埛 ID
   * @returns 鎭㈠缁撴灉
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

  // ==================== 瀹炴椂鎺у埗鏂规硶 ====================

  /**
   * 韪㈠嚭鐢ㄦ埛鐨勬墍鏈夊叾浠栬澶?   *
   * 浣跨敤鍦烘櫙锛?   * - 鏂拌澶囩櫥褰曟椂韪㈠嚭鏃ц澶?   * - 瀹夊叏绛栫暐鎵ц
   * - 璁惧鏁伴噺闄愬埗
   * - 寮哄埗鍗曡澶囩櫥褰?   *
   * @param userId 鐢ㄦ埛 ID
   * @param excludeSessionId 鎺掗櫎鐨勪細璇?ID
   * @returns 韪㈠嚭缁撴灉
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
   * 韪㈠嚭鎸囧畾璁惧
   *
   * 浣跨敤鍦烘櫙锛?   * - 鍙枒璁惧澶勭悊
   * - 璁惧涓㈠け澶勭悊
   * - 绮剧‘鎺у埗
   * - 瀹夊叏浜嬩欢鍝嶅簲
   *
   * @param sessionId 浼氳瘽 ID
   * @returns 韪㈠嚭缁撴灉
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

  // ==================== 鏌ヨ鍜岀洃鎺ф柟娉?====================

  /**
   * 鑾峰彇鐢ㄦ埛鐨勬墍鏈変細璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛鏌ョ湅鑷繁鐨勭櫥褰曡澶?   * - 绠＄悊鍛樻煡鐪嬬敤鎴蜂細璇濈姸鎬?   * - 瀹夊叏瀹¤鍜岃皟鏌?   * - 璁惧绠＄悊
   *
   * @param userId 鐢ㄦ埛 ID
   * @returns 浼氳瘽鍒楄〃
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
   * 鑾峰彇浼氳瘽缁熻淇℃伅
   *
   * 浣跨敤鍦烘櫙锛?   * - 绯荤粺鐩戞帶闈㈡澘
   * - 鎬ц兘鍒嗘瀽
   * - 瀹归噺瑙勫垝
   * - 瀹夊叏瀹¤
   *
   * @returns 缁熻淇℃伅
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
   * 鑾峰彇鐢ㄦ埛浼氳瘽缁熻淇℃伅
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛琛屼负鍒嗘瀽
   * - 瀹夊叏椋庨櫓璇勪及
   * - 鐢ㄦ埛鏀寔
   * - 涓€у寲鏈嶅姟
   *
   * @param userId 鐢ㄦ埛 ID
   * @returns 鐢ㄦ埛缁熻淇℃伅
   */
  async getUserSessionStats(userId: string): Promise<{
    total: number
    active: number
    devices: string[]
    lastActiveAt: Date
  }> {
    return this.sessionRepo.getUserSessionStats(userId)
  }

  // ==================== 绉佹湁鏂规硶 ====================

  /**
   * 妫€鏌ョ敤鎴蜂細璇濇暟閲忛檺鍒?   *
   * 浣跨敤鍦烘櫙锛?   * - 闃叉鐢ㄦ埛鍒涘缓杩囧浼氳瘽
   * - 璧勬簮浣跨敤鎺у埗
   * - 瀹夊叏绛栫暐鎵ц
   * - 鎬ц兘浼樺寲
   *
   * @param userId 鐢ㄦ埛 ID
   */
  private async checkSessionLimit(userId: string): Promise<void> {
    const activeCount = await this.sessionRepo.countActiveByUserId(userId)
    if (activeCount >= this.defaultConfig.maxSessionsPerUser) {
      throw new Error(`Session limit exceeded for user ${userId}`)
    }
  }

  /**
   * 鐢熸垚 JWT 浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 鍒涘缓璁块棶浠ょ墝
   * - 鍒涘缓鍒锋柊浠ょ墝
   * - 浠ょ墝绛惧悕鍜岄獙璇?   * - 瀹夊叏绛栫暐搴旂敤
   *
   * @param session 浼氳瘽瀹炰綋
   * @param type 浠ょ墝绫诲瀷
   * @returns JWT 浠ょ墝
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
   * 鍒ゆ柇鏄惁闇€瑕佽嚜鍔ㄧ画鏈?   *
   * 浣跨敤鍦烘櫙锛?   * - 鑷姩缁湡鏈哄埗瑙﹀彂
   * - 鐢ㄦ埛浣撻獙浼樺寲
   * - 瀹夊叏绛栫暐鎵ц
   * - 鎬ц兘浼樺寲
   *
   * @param session 浼氳瘽瀹炰綋
   * @returns 鏄惁闇€瑕佺画鏈?   */
  private shouldAutoRenew(session: Session): boolean {
    if (!this.defaultConfig.enableAutoRenewal) {
      return false
    }

    const remainingTime = session.getRemainingTime()
    const renewalThreshold = 300 // 5鍒嗛挓

    return remainingTime > 0 && remainingTime <= renewalThreshold
  }

  /**
   * 鑷姩缁湡浼氳瘽
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛娲昏穬鏃剁殑鑷姩缁湡
   * - 鏃犵紳鐨勭敤鎴蜂綋楠?   * - 瀹夊叏绛栫暐璋冩暣
   * - 鎬ц兘浼樺寲
   *
   * @param session 浼氳瘽瀹炰綋
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
