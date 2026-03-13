import { randomUUID } from 'crypto'
import { SessionStatus } from '@oes/common/constants'

// 璁惧淇℃伅鎺ュ彛
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
  location?: string
  platform?: string
  browser?: string
}

// Session 閰嶇疆鎺ュ彛
export interface SessionConfig {
  accessTokenExpiry: number // 绉?  refreshTokenExpiry: number // 绉?  maxSessionsPerUser: number
  enableAutoRenewal: boolean
  enableDeviceTracking: boolean
}

/**
 * Session 瀹炰綋
 *
 * 鍔熻兘锛氱鐞嗙敤鎴蜂細璇濈姸鎬佸拰浠ょ墝
 *
 * 浣跨敤鍦烘櫙锛? * - 鐢ㄦ埛鐧诲綍鍚庣殑浼氳瘽绠＄悊
 * - 鍙屼护鐗岋紙璁块棶浠ょ墝 + 鍒锋柊浠ょ墝锛夋満鍒? * - 璁惧绾у埆鐨勪細璇濇帶鍒? * - 绠＄悊鍛樺浼氳瘽鐨勫疄鏃舵帶鍒? * - 瀹夊叏瀹¤鍜岀洃鎺? *
 * 鎶€鏈壒鐐癸細
 * - 鏀寔鑷姩杩囨湡鏈哄埗
 * - 鏀寔绠＄悊鍛樻帶鍒讹紙鎾ら攢銆佹殏鍋溿€佹仮澶嶏級
 * - 璁惧淇℃伅杩借釜
 * - 澶氱淮搴﹀畨鍏ㄦ帶鍒? */
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
      // 绠＄悊鍛樻帶鍒跺瓧娈?      isAdminControlled: boolean
      adminRevokeReason?: string
      adminRevokeAt?: Date
      adminRevokeBy?: string
    }
  ) {}

  /**
   * 鍒涘缓鏂扮殑 Session
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛棣栨鐧诲綍鏃跺垱寤轰細璇?   * - 鏂拌澶囩櫥褰曟椂鍒涘缓浼氳瘽
   * - 浠ょ墝鍒锋柊鏃跺垱寤烘柊浼氳瘽
   * - 绠＄悊鍛樹负鐢ㄦ埛鍒涘缓浼氳瘽
   *
   * @param params 鍒涘缓鍙傛暟
   * @returns Session 瀹炰緥
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
   * 浠?Redis 鏁版嵁鍒涘缓 Session
   *
   * 浣跨敤鍦烘櫙锛?   * - 浠庣紦瀛樹腑鎭㈠浼氳瘽鐘舵€?   * - 绯荤粺閲嶅惎鍚庣殑浼氳瘽鎭㈠
   * - 鍒嗗竷寮忛儴缃蹭腑鐨勪細璇濆悓姝?   * - 鏁版嵁杩佺Щ鍜屽浠芥仮澶?   *
   * @param data Redis 鏁版嵁
   * @returns Session 瀹炰緥
   */
  static fromRedis(data: Record<string, any>): Session {
    return new Session({
      id: data.id,
      userId: data.userId,
      accountId: data.accountId,
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
   * 杞崲涓?Redis 瀛樺偍鏍煎紡
   *
   * 浣跨敤鍦烘櫙锛?   * - 淇濆瓨浼氳瘽鍒?Redis 缂撳瓨
   * - 鏁版嵁搴忓垪鍖栫敤浜庝紶杈?   * - 浼氳瘽鐘舵€佹寔涔呭寲
   * - 鍒嗗竷寮忎細璇濆悓姝?   *
   * @returns Redis 鏁版嵁鏍煎紡
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

  // ==================== 楠岃瘉鏂规硶 ====================

  /**
   * 楠岃瘉璁块棶浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - API 璇锋眰鏃剁殑浠ょ墝楠岃瘉
   * - 妫€鏌ヤ护鐗屾槸鍚﹀尮閰嶅綋鍓嶄細璇?   * - 瀹夊叏瀹¤鍜岀洃鎺?   * - 闃叉浠ょ墝浼€?   *
   * @param token 璁块棶浠ょ墝
   * @returns 鏄惁鏈夋晥
   */
  validateAccessToken(token: string): boolean {
    return this.props.accessToken === token && this.isActive() && !this.isExpired()
  }

  /**
   * 楠岃瘉鍒锋柊浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 鍒锋柊浠ょ墝鏃剁殑楠岃瘉
   * - 闀挎湡浼氳瘽绠＄悊
   * - 浠ょ墝杞崲鏈哄埗
   * - 瀹夊叏瀹¤
   *
   * @param token 鍒锋柊浠ょ墝
   * @returns 鏄惁鏈夋晥
   */
  validateRefreshToken(token: string): boolean {
    return this.props.refreshToken === token && this.isActive() && !this.isRefreshExpired()
  }

  // ==================== 鐘舵€佹鏌ユ柟娉?====================

  /**
   * 妫€鏌ヤ細璇濇槸鍚﹁繃鏈?   *
   * 浣跨敤鍦烘櫙锛?   * - 璁块棶浠ょ墝杩囨湡妫€鏌?   * - 鑷姩娓呯悊杩囨湡浼氳瘽
   * - 瀹夊叏绛栫暐鎵ц
   * - 鎬ц兘浼樺寲
   *
   * @returns 鏄惁杩囨湡
   */
  isExpired(): boolean {
    return Date.now() > this.props.expiresAt.getTime()
  }

  /**
   * 妫€鏌ュ埛鏂颁护鐗屾槸鍚﹁繃鏈?   *
   * 浣跨敤鍦烘櫙锛?   * - 鍒锋柊浠ょ墝杩囨湡妫€鏌?   * - 闀挎湡浼氳瘽绠＄悊
   * - 鑷姩缁湡鍒ゆ柇
   * - 瀹夊叏绛栫暐鎵ц
   *
   * @returns 鏄惁杩囨湡
   */
  isRefreshExpired(): boolean {
    return Date.now() > this.props.refreshExpiresAt.getTime()
  }

  /**
   * 妫€鏌ユ槸鍚﹁绠＄悊鍛樻挙閿€
   *
   * 浣跨敤鍦烘櫙锛?   * - 绠＄悊鍛樻帶鍒舵鏌?   * - 瀹夊叏浜嬩欢鍝嶅簲
   * - 鐢ㄦ埛杩濊澶勭悊
   * - 瀹¤杩借釜
   *
   * @returns 鏄惁琚挙閿€
   */
  isAdminRevoked(): boolean {
    return this.props.status === SessionStatus.REVOKED && this.props.isAdminControlled
  }

  // ==================== 涓氬姟鏂规硶 ====================

  /**
   * 鏇存柊鏈€鍚庢椿璺冩椂闂?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛娲诲姩鏃舵洿鏂颁細璇濈姸鎬?   * - 浼氳瘽娲昏穬搴︾洃鎺?   * - 鑷姩缁湡瑙﹀彂
   * - 鐢ㄦ埛琛屼负鍒嗘瀽
   */
  touch(): void {
    this.props.lastActiveAt = new Date()
  }

  /**
   * 缁湡璁块棶浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 鑷姩缁湡鏈哄埗
   * - 鐢ㄦ埛娲昏穬鏃跺欢闀夸細璇?   * - 瀹夊叏绛栫暐璋冩暣
   * - 鐢ㄦ埛浣撻獙浼樺寲
   *
   * @param expirySeconds 鏂扮殑杩囨湡鏃堕棿锛堢锛?   */
  renewAccessToken(expirySeconds: number): void {
    this.props.expiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  /**
   * 缁湡鍒锋柊浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 闀挎湡浼氳瘽绠＄悊
   * - 鑷姩缁湡鏈哄埗
   * - 瀹夊叏绛栫暐璋冩暣
   * - 鐢ㄦ埛浣撻獙浼樺寲
   *
   * @param expirySeconds 鏂扮殑杩囨湡鏃堕棿锛堢锛?   */
  renewRefreshToken(expirySeconds: number): void {
    this.props.refreshExpiresAt = new Date(Date.now() + expirySeconds * 1000)
    this.touch()
  }

  // ==================== 绠＄悊鍛樻帶鍒舵柟娉?====================

  /**
   * 绠＄悊鍛樻挙閿€浼氳瘽
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛杩濊澶勭悊
   * - 瀹夊叏浜嬩欢鍝嶅簲
   * - 鍙枒璁惧澶勭悊
   * - 寮哄埗鐢ㄦ埛閲嶆柊鐧诲綍
   *
   * @param reason 鎾ら攢鍘熷洜
   * @param adminId 绠＄悊鍛?ID
   */
  adminRevoke(reason: string, adminId: string): void {
    this.props.status = SessionStatus.REVOKED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  /**
   * 绠＄悊鍛樻殏鍋滀細璇?   *
   * 浣跨敤鍦烘櫙锛?   * - 涓存椂灏佺鐢ㄦ埛
   * - 璋冩煡鏈熼棿鏆傚仠
   * - 鍙仮澶嶇殑澶勭綒
   * - 瀹夊叏浜嬩欢澶勭悊
   *
   * @param reason 鏆傚仠鍘熷洜
   * @param adminId 绠＄悊鍛?ID
   */
  adminSuspend(reason: string, adminId: string): void {
    this.props.status = SessionStatus.SUSPENDED
    this.props.isAdminControlled = true
    this.props.adminRevokeReason = reason
    this.props.adminRevokeAt = new Date()
    this.props.adminRevokeBy = adminId
  }

  /**
   * 鎭㈠浼氳瘽
   *
   * 浣跨敤鍦烘櫙锛?   * - 璋冩煡缁撴潫鍚庣殑鎭㈠
   * - 璇皝鍚庣殑鎭㈠
   * - 澶勭綒鏈熸弧鍚庣殑鎭㈠
   * - 瀹夊叏浜嬩欢瑙ｅ喅
   */
  restore(): void {
    this.props.status = SessionStatus.ACTIVE
    this.props.isAdminControlled = false
    this.props.adminRevokeReason = undefined
    this.props.adminRevokeAt = undefined
    this.props.adminRevokeBy = undefined
  }

  // ==================== 璁＄畻灞炴€ф柟娉?====================

  /**
   * 鑾峰彇鍓╀綑鏃堕棿
   *
   * 浣跨敤鍦烘櫙锛?   * - 瀹㈡埛绔樉绀哄墿浣欐椂闂?   * - 鑷姩缁湡鍒ゆ柇
   * - 鐢ㄦ埛浣撻獙浼樺寲
   * - 瀹夊叏绛栫暐鎵ц
   *
   * @returns 鍓╀綑绉掓暟
   */
  getRemainingTime(): number {
    const remaining = this.props.expiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  /**
   * 鑾峰彇鍒锋柊浠ょ墝鍓╀綑鏃堕棿
   *
   * 浣跨敤鍦烘櫙锛?   * - 闀挎湡浼氳瘽绠＄悊
   * - 鑷姩缁湡鍒ゆ柇
   * - 鐢ㄦ埛浣撻獙浼樺寲
   * - 瀹夊叏绛栫暐鎵ц
   *
   * @returns 鍓╀綑绉掓暟
   */
  getRefreshRemainingTime(): number {
    const remaining = this.props.refreshExpiresAt.getTime() - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  // ==================== Getter 鏂规硶 ====================

  /**
   * 鑾峰彇浼氳瘽 ID
   *
   * 浣跨敤鍦烘櫙锛?   * - 浼氳瘽鏍囪瘑鍜岃拷韪?   * - 鏁版嵁搴撴搷浣?   * - 鏃ュ織璁板綍
   * - 瀹¤杩借釜
   *
   * @returns 浼氳瘽 ID
   */
  getId(): string {
    return this.props.id
  }

  /**
   * 鑾峰彇鐢ㄦ埛 ID
   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛浼氳瘽鍏宠仈
   * - 鏉冮檺楠岃瘉
   * - 鐢ㄦ埛琛屼负鍒嗘瀽
   * - 瀹夊叏瀹¤
   *
   * @returns 鐢ㄦ埛 ID
   */
  getUserId(): string {
    return this.props.userId
  }

  /**
   * 鑾峰彇璁块棶浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - API 璇锋眰璁よ瘉
   * - 浠ょ墝楠岃瘉
   * - 瀹夊叏瀹¤
   * - 璋冭瘯鍜岀洃鎺?   *
   * @returns 璁块棶浠ょ墝
   */
  getAccessToken(): string {
    return this.props.accessToken
  }

  /**
   * 鑾峰彇鍒锋柊浠ょ墝
   *
   * 浣跨敤鍦烘櫙锛?   * - 浠ょ墝鍒锋柊鏈哄埗
   * - 闀挎湡浼氳瘽绠＄悊
   * - 瀹夊叏瀹¤
   * - 璋冭瘯鍜岀洃鎺?   *
   * @returns 鍒锋柊浠ょ墝
   */
  getRefreshToken(): string {
    return this.props.refreshToken
  }

  /**
   * 鑾峰彇浼氳瘽鐘舵€?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐘舵€佹鏌ュ拰楠岃瘉
   * - 瀹夊叏绛栫暐鎵ц
   * - 鐩戞帶鍜屽璁?   * - 鐢ㄦ埛浣撻獙鎺у埗
   *
   * @returns 浼氳瘽鐘舵€?   */
  getStatus(): SessionStatus {
    return this.props.status
  }

  /**
   * 鑾峰彇璁惧淇℃伅
   *
   * 浣跨敤鍦烘櫙锛?   * - 璁惧杩借釜鍜岀鐞?   * - 瀹夊叏椋庨櫓璇勪及
   * - 鐢ㄦ埛浣撻獙浼樺寲
   * - 瀹¤鍜岀洃鎺?   *
   * @returns 璁惧淇℃伅
   */
  getDeviceInfo(): DeviceInfo {
    return this.props.deviceInfo
  }

  /**
   * 鑾峰彇鍒涘缓鏃堕棿
   *
   * 浣跨敤鍦烘櫙锛?   * - 浼氳瘽鐢熷懡鍛ㄦ湡绠＄悊
   * - 瀹¤杩借釜
   * - 鏁版嵁鍒嗘瀽
   * - 瀹夊叏璋冩煡
   *
   * @returns 鍒涘缓鏃堕棿
   */
  getCreatedAt(): Date {
    return this.props.createdAt
  }

  /**
   * 鑾峰彇鏈€鍚庢椿璺冩椂闂?   *
   * 浣跨敤鍦烘櫙锛?   * - 鐢ㄦ埛娲昏穬搴﹀垎鏋?   * - 鑷姩缁湡鍒ゆ柇
   * - 瀹夊叏椋庨櫓璇勪及
   * - 鐢ㄦ埛浣撻獙浼樺寲
   *
   * @returns 鏈€鍚庢椿璺冩椂闂?   */
  getLastActiveAt(): Date {
    return this.props.lastActiveAt
  }

  /**
   * 鑾峰彇杩囨湡鏃堕棿
   *
   * 浣跨敤鍦烘櫙锛?   * - 杩囨湡妫€鏌?   * - 鑷姩娓呯悊
   * - 鐢ㄦ埛浣撻獙浼樺寲
   * - 瀹夊叏绛栫暐鎵ц
   *
   * @returns 杩囨湡鏃堕棿
   */
  getExpiresAt(): Date {
    return this.props.expiresAt
  }

  /**
   * 鑾峰彇鍒锋柊浠ょ墝杩囨湡鏃堕棿
   *
   * 浣跨敤鍦烘櫙锛?   * - 闀挎湡浼氳瘽绠＄悊
   * - 鑷姩缁湡鍒ゆ柇
   * - 瀹夊叏绛栫暐鎵ц
   * - 鐢ㄦ埛浣撻獙浼樺寲
   *
   * @returns 鍒锋柊浠ょ墝杩囨湡鏃堕棿
   */
  getRefreshExpiresAt(): Date {
    return this.props.refreshExpiresAt
  }

  /**
   * 鑾峰彇鍏冩暟鎹?   *
   * 浣跨敤鍦烘櫙锛?   * - 鎵╁睍淇℃伅瀛樺偍
   * - 鑷畾涔変笟鍔￠€昏緫
   * - 瀹¤鍜岀洃鎺?   * - 鏁版嵁鍒嗘瀽
   *
   * @returns 鍏冩暟鎹?   */
  getMetadata(): Record<string, any> | undefined {
    return this.props.metadata
  }

  /**
   * 妫€鏌ヤ細璇濇槸鍚︽椿璺?   *
   * 浣跨敤鍦烘櫙锛?   * - 浼氳瘽鏈夋晥鎬ч獙璇?   * - 瀹夊叏绛栫暐鎵ц
   * - 鐢ㄦ埛浣撻獙鎺у埗
   * - 鐩戞帶鍜屽璁?   *
   * @returns 鏄惁娲昏穬
   */
  isActive(): boolean {
    return this.props.status === SessionStatus.ACTIVE
  }

  /**
   * 妫€鏌ユ槸鍚﹁绠＄悊鍛樻帶鍒?   *
   * 浣跨敤鍦烘櫙锛?   * - 绠＄悊鍛樻潈闄愭鏌?   * - 瀹夊叏浜嬩欢澶勭悊
   * - 瀹¤杩借釜
   * - 鏉冮檺楠岃瘉
   *
   * @returns 鏄惁琚鐞嗗憳鎺у埗
   */
  isAdminControlled(): boolean {
    return this.props.isAdminControlled
  }

  /**
   * 鑾峰彇绠＄悊鍛樻挙閿€淇℃伅
   *
   * 浣跨敤鍦烘櫙锛?   * - 瀹夊叏浜嬩欢璋冩煡
   * - 瀹¤杩借釜
   * - 绠＄悊鍛樻搷浣滆褰?   * - 鐢ㄦ埛鏀寔
   *
   * @returns 鎾ら攢淇℃伅
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
