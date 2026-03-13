import { BadRequestException, Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService } from '@oes/common/auth'
import { LoginMethodEnum } from '@oes/common/constants'
import { SessionService } from './session.service'
import { MfaService } from './mfa.service'
import { DeviceInfo } from 'src/domain/aggregates/usersession.aggregate'
import { AuthStrategyFactory } from 'src/domain/services/strategies/auth-strategies.factory'
import { IIdentityServicePort } from '../ports'
import { LoginResponseDto } from '@oes/common/dtos'
import { AccountDto } from '@oes/common/dtos'
import { IDENTITY_SERVICE } from '@oes/common/constants'

/**
 * 鐠併倛鐦夐張宥呭
 *
 * 閸旂喕鍏橀敍姘槱閻炲棛鏁ら幋椋庢瑜版洝顓荤拠浣烘畱閺嶇绺炬稉姘闁槒绶? *
 * 娴ｈ法鏁ら崷鐑樻珯閿? * - 閻劍鍩涢惂璇茬秿鐠併倛鐦? * - 婢舵氨顫掗惂璇茬秿閺傜懓绱￠弨顖涘瘮
 * - 娴兼俺鐦介崚娑樼紦閸滃瞼顓搁悶? * - MFA 妤犲矁鐦夐梿鍡樺灇
 * - 鐠佹儳顦穱鈩冧紖鐠佹澘缍? * - 鐎瑰鍙忕€孤ゎ吀
 *
 * 閹垛偓閺堫垳澹掗悙鐧哥窗
 * - 閺€顖涘瘮婢舵氨顫掔拋銈堢槈閺傜懓绱￠敍鍫ュ仏缁犲崬鐦戦惍浣碘偓涓盇uth閵嗕副TP閿? * - 闂嗗棙鍨?SessionService 鏉╂稖顢戞导姘崇樈缁狅紕鎮? * - 闂嗗棙鍨?MfaService 鏉╂稖顢戞径姘礈缁辩姾顓荤拠? * - 娴ｈ法鏁?CommonJwtService 鏉╂稖顢戞禒銈囧婢跺嫮鎮? * - 鐠佹儳顦穱鈩冧紖鏉╁€熼嚋
 * - 鐎瑰鍙忛弮銉ョ箶鐠佹澘缍? */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly strategyFactory: AuthStrategyFactory,
    private readonly commonJwtService: CommonJwtService,
    private readonly sessionService: SessionService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort
  ) {}

  /**
   * 閻劍鍩涢惂璇茬秿
   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 閻劍鍩涙＃鏍偧閻ц缍?   * - 婢舵俺顔曟径鍥╂瑜?   * - 鐎瑰鍙忕拋銈堢槈濞翠胶鈻?   * - 娴兼俺鐦介崚娑樼紦
   * - 鐠佹儳顦穱鈩冧紖鐠佹澘缍?   *
   * @param method 閻ц缍嶉弬鐟扮础
   * @param dto 閻ц缍嶉弫鐗堝祦
   * @param deviceInfo 鐠佹儳顦穱鈩冧紖
   * @returns 閻ц缍嶇紒鎾寸亯
   */
  async login<T>(
    method: LoginMethodEnum,
    payload: T,
    deviceInfo?: DeviceInfo
  ): Promise<LoginResponseDto> {
    // 1 闁瀚ㄧ拋銈堢槈缁涙牜鏆?    const strategy = this.strategyFactory.get(method)
    if (!strategy) throw new Error(`Unsupported login method type: ${String(method)}`)

    // 2 鐠併倛鐦夐悽銊﹀煕
    const userId = await strategy.authenticate(payload)
    const user = await this.identityService.getUserById(userId)
    if (!user) throw new Error('User not found')

    // 3 濡偓閺屻儲妲搁崥锕傛付鐟?MFA
    const shouldTriggerMfa = await this.mfaService.shouldTriggerMfa(user.id)
    if (shouldTriggerMfa) {
      // 閻㈢喐鍨?MFA 娴犮倗澧?      const mfaToken = await this.mfaService.generateOneTimeToken(user.id)
      this.logger.log(`MFA required for user ${user.id}, token generated`)

      // 鏉╂柨娲?MFA 閹告垶鍨穱鈩冧紖
      return {
        userId: user.id,
        mfaRequired: true,
        challengeId: mfaToken.tokenId,
        mfaType: mfaToken.type
      }
    }

    // 4 濡偓閺屻儲妲搁崥锔胯礋婢舵俺澶勯幋?    const accounts: AccountDto[] = await this.identityService.getAccountsByUserId({
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

    // 5 閸掓稑缂撴导姘崇樈
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
   * MFA 妤犲矁鐦夐崥搴礉閸愬秹鈧瀚ㄧ拹锔藉煕閻ц缍?   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - MFA 妤犲矁鐦夊ù浣衡柤
   * - 鐎瑰本鍨氶惂璇茬秿鏉╁洨鈻?   * - 鐎瑰鍙忔宀冪槈
   * - 娴兼俺鐦介崚娑樼紦
   *
   * @param mfaTokenId MFA 娴犮倗澧?ID
   * @param mfaCode MFA 妤犲矁鐦夐惍?   * @param deviceInfo 鐠佹儳顦穱鈩冧紖
   * @returns 閻ц缍嶇紒鎾寸亯
   */
  async loginAfterMfa(
    mfaTokenId: string,
    mfaCode: string,
    deviceInfo: DeviceInfo
  ): Promise<LoginResponseDto> {
    this.logger.log(`MFA verification for token ${mfaTokenId}`)

    // 1 妤犲矁鐦?MFA 娴狅絿鐖?    const userId = await this.mfaService.verifyMfaCode(mfaTokenId, mfaCode)
    if (!userId) {
      throw new BadRequestException('Invalid MFA code')
    }

    // 2 濡偓閺屻儲妲搁崥锔胯礋婢舵俺澶勯幋?    const accounts: AccountDto[] = await this.identityService.getAccountsByUserId({
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

    // 3 閸掓稑缂撴导姘崇樈
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

    // 1 濡偓閺屻儳鏁ら幋閿嬫箒閺佸牊鈧?    const user = await this.identityService.getUserById({ userId: userId })
    if (!user) throw new Error('User not found')

    // 2 濡偓閺屻儴澶勯幋閿嬫箒閺佸牊鈧?    const account = await this.identityService.getAccountById({ accountId: accountId })
    if (!account || account.userId !== user.id || account.isEnable) {
      throw new BadRequestException('Invalid account selection')
    }

    // 3 閸掓稑缂撴导姘崇樈
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
   * 閸掗攱鏌婃禒銈囧
   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 鐠佸潡妫舵禒銈囧鏉╁洦婀￠弮鍓佹畱閸掗攱鏌?   * - 闂€鎸庢埂娴兼俺鐦界紒瀛樺Б
   * - 閻劍鍩涙担鎾荤崣娴兼ê瀵?   * - 鐎瑰鍙忔禒銈囧鏉烆喗宕?   *
   * @param refreshToken 閸掗攱鏌婃禒銈囧
   * @returns 閺傛壆娈戞禒銈囧鐎?   */
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
   * 閻劍鍩涢惂璇插毉
   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 閻劍鍩涙稉璇插З閻ц鍤?   * - 鐎瑰鍙忔禍瀣╂閸濆秴绨?   * - 娴兼俺鐦藉〒鍛倞
   * - 鐠佹儳顦粻锛勬倞
   *
   * @param sessionId 娴兼俺鐦?ID
   * @returns 閻ц鍤紒鎾寸亯
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
   * 閻劍鍩涢惂璇插毉閹碘偓閺堝顔曟径?   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 鐎靛棛鐖滄穱顔芥暭閸氬海娈戝鍝勫煑闁插秵鏌婇惂璇茬秿
   * - 鐎瑰鍙忔禍瀣╂婢跺嫮鎮?   * - 鐠愶附鍩涚亸浣侯洣
   * - 閹靛綊鍣烘导姘崇樈濞撳懐鎮?   *
   * @param userId 閻劍鍩?ID
   * @returns 閻ц鍤紒鎾寸亯
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
   * 妤犲矁鐦夌拋鍧楁６娴犮倗澧?   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - API 鐠囬攱鐪伴弮鍓佹畱娴犮倗澧濇宀冪槈
   * - 閼惧嘲褰囬悽銊﹀煕娴兼俺鐦芥穱鈩冧紖
   * - 閼奉亜濮╃紒顓熸埂閺堝搫鍩?   * - 鐎瑰鍙忕€孤ゎ吀
   *
   * @param accessToken 鐠佸潡妫舵禒銈囧
   * @returns 妤犲矁鐦夌紒鎾寸亯
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
   * 閼惧嘲褰囬悽銊﹀煕娴兼俺鐦芥穱鈩冧紖
   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 閻劍鍩涢弻銉ф箙閻ц缍嶇拋鎯ь槵
   * - 缁狅紕鎮婇崨妯荤叀閻鏁ら幋椋庡Ц閹?   * - 鐎瑰鍙忕€孤ゎ吀
   * - 鐠佹儳顦粻锛勬倞
   *
   * @param userId 閻劍鍩?ID
   * @returns 娴兼俺鐦芥穱鈩冧紖
   */
  async getUserSessions(userId: string) {
    this.logger.log(`Getting sessions for user ${userId}`)

    return this.sessionService.getUserSessions(userId)
  }

  // ==================== 缁狅紕鎮婇崨妯诲付閸掕埖鏌熷▔?====================

  /**
   * 缁狅紕鎮婇崨妯绘寵闁库偓閻劍鍩涢幍鈧張澶夌窗鐠?   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 閻劍鍩涙潻婵婎潐婢跺嫮鎮?   * - 鐎瑰鍙忔禍瀣╂閸濆秴绨?   * - 鐠愶附鍩涚亸浣侯洣
   * - 瀵搫鍩楅柌宥嗘煀閻ц缍?   *
   * @param userId 閻劍鍩?ID
   * @param reason 閹俱倝鏀㈤崢鐔锋礈
   * @param adminId 缁狅紕鎮婇崨?ID
   * @returns 閹俱倝鏀㈢紒鎾寸亯
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
   * 缁狅紕鎮婇崨妯挎丢閸戠儤瀵氱€规俺顔曟径?   *
   * 娴ｈ法鏁ら崷鐑樻珯閿?   * - 閸欘垳鏋掔拋鎯ь槵婢跺嫮鎮?   * - 鐠佹儳顦稉銏犮亼婢跺嫮鎮?   * - 缁墽鈥橀幒褍鍩?   * - 鐎瑰鍙忔禍瀣╂閸濆秴绨?   *
   * @param sessionId 娴兼俺鐦?ID
   * @returns 闊垹鍤紒鎾寸亯
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
