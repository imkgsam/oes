import { MfaBinding as PrismaMfaBinding } from '../../../prisma/generated/prisma'
import { MfaType } from '@oes/common/constants'
import {
  createSystemException,
  createBusinessException
} from '@oes/common/exceptions'
import { authenticator } from 'otplib' //鏄竴涓敤浜庣敓鎴愬拰楠岃瘉涓€娆℃€у瘑鐮侊紙OTP锛夌殑 JavaScript 搴擄紝涓昏鐢ㄤ簬瀹炵幇澶氬洜绱犺璇侊紙MFA锛夊姛鑳姐€?import { compare, hash } from 'bcrypt'
import { randomUUID } from 'crypto'
import { OneTimeToken } from './otp.aggregate'
import { AUTH_SERVICE_ERRORS } from '../../common/constants/exceptions/auth-service.exceptions'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants'

// 璁惧淇℃伅鎺ュ彛
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
}

export class MfaBindingEntity {
  constructor(
    private props: {
      id: string
      userId: string
      type: MfaType
      secret: string
      enabled: boolean
      createdAt: Date
      updatedAt: Date
      // 鎵╁睍瀛楁锛岀敤浜庝笉鍚岀被鍨?MFA 鐨勭壒瀹氶厤缃?      metadata?: Record<string, any>
      backupCodes?: string[] // 澶囩敤鐮侊紝鐢ㄤ簬 BACKUP_CODE 绫诲瀷
      deviceInfo?: DeviceInfo
    }
  ) {}

  // 浠?Prisma 妯″瀷鍒涘缓 MfaBindingEntity
  static fromPrisma(prismaMfaBinding: PrismaMfaBinding): MfaBindingEntity {
    let metadata: Record<string, any> | undefined
    let deviceInfo: DeviceInfo | undefined

    try {
      if (prismaMfaBinding.metadata) {
        metadata = JSON.parse(prismaMfaBinding.metadata) as Record<string, any>
      }
    } catch (error) {
      throw createSystemException(GLOBAL_SYSTEM_ERRORS.MFA_METADATA_PARSE_ERROR, {
        bindingId: prismaMfaBinding.id,
        originalError: error instanceof Error ? error.message : String(error)
      })
    }

    try {
      if (prismaMfaBinding.deviceInfo) {
        deviceInfo = JSON.parse(prismaMfaBinding.deviceInfo) as DeviceInfo
      }
    } catch (error) {
      throw createSystemException(GLOBAL_SYSTEM_ERRORS.MFA_DEVICE_INFO_PARSE_ERROR, {
        bindingId: prismaMfaBinding.id,
        originalError: error instanceof Error ? error.message : String(error)
      })
    }

    return new MfaBindingEntity({
      id: prismaMfaBinding.id,
      userId: prismaMfaBinding.userId,
      type: prismaMfaBinding.type as MfaType,
      secret: prismaMfaBinding.secret,
      enabled: prismaMfaBinding.enabled,
      createdAt: prismaMfaBinding.createdAt,
      updatedAt: prismaMfaBinding.updatedAt,
      metadata,
      deviceInfo
    })
  }

  // 鍒涘缓鏂扮殑 TOTP 缁戝畾锛堟楠?1-2锛氱敤鎴峰彂璧风粦瀹氳姹傦紝鍚庣鐢熸垚瀵嗛挜锛?  static createTotpBinding(userId: string, deviceInfo?: DeviceInfo): MfaBindingEntity {
    const secret = authenticator.generateSecret() // 姝ラ 2锛氱敓鎴愬瘑閽?    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.TOTP,
      secret,
      enabled: false, // 鍒濆鐘舵€佷负绂佺敤锛岄獙璇佸悗鍚敤
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceInfo
    })
  }

  // 鐢熸垚缁戝畾浜岀淮鐮侊紙姝ラ 3锛氱敓鎴愮粦瀹氫簩缁寸爜锛?  generateBindingQrCode(issuer: string, accountName: string): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 鐢熸垚 OTPAuth URI 鏍煎紡鐨勪簩缁寸爜
    return authenticator.keyuri(accountName, issuer, this.props.secret)
  }

  // 鐢熸垚娴嬭瘯楠岃瘉鐮侊紙姝ラ 4-5锛氱敤鎴锋壂鐮佸悗锛岀敓鎴愭祴璇曠爜渚涚敤鎴疯緭鍏ワ級
  generateTestCode(): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 鐢熸垚褰撳墠鏃堕棿绐楀彛鐨勯獙璇佺爜
    return authenticator.generate(this.props.secret)
  }

  // 楠岃瘉 TOTP 缁戝畾锛堟楠?6锛氬悗绔牎楠岄獙璇佺爜锛?  verifyTotpBinding(inputCode: string): boolean {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 楠岃瘉鐢ㄦ埛杈撳叆鐨勯獙璇佺爜鏄惁姝ｇ‘
    return authenticator.verify({
      token: inputCode,
      secret: this.props.secret
    })
  }

  // 婵€娲?TOTP 缁戝畾锛堟楠?7锛氱粦瀹氭垚鍔熷苟淇濆瓨瀵嗛挜锛?  activateTotpBinding(): void {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    this.props.enabled = true
    this.touch()
  }

  // 楠岃瘉 TOTP 浠ｇ爜锛堢敤浜庣櫥褰曟椂鐨勯獙璇侊級
  verifyTotp(inputCode: string): boolean {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    if (!this.isEnabled()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_DISABLED)
    }

    return authenticator.verify({
      token: inputCode,
      secret: this.props.secret
    })
  }

  // 鑾峰彇 TOTP 瀵嗛挜锛堢敤浜庣敓鎴愭祴璇曚唬鐮侊級
  getSecret(): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    return this.props.secret
  }

  // 妫€鏌ョ粦瀹氱姸鎬?  isBindingActive(): boolean {
    return this.props.enabled
  }

  // 鑾峰彇缁戝畾淇℃伅锛堢敤浜庡墠绔樉绀猴級
  getBindingInfo(
    issuer: string,
    accountName: string
  ): {
    qrCodeUrl: string
    secret: string
    testCode: string
  } {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    return {
      qrCodeUrl: this.generateBindingQrCode(issuer, accountName),
      secret: this.props.secret,
      testCode: this.generateTestCode()
    }
  }

  // 鍒涘缓閭 OTP 缁戝畾锛堥渶瑕?OTP 楠岃瘉锛?  static createEmailOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.EMAIL_OTP,
      secret: '', // 閭 OTP 涓嶉渶瑕侀瀛樺瘑閽?      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 鍒涘缓鐭俊 OTP 缁戝畾锛堥渶瑕?OTP 楠岃瘉锛?  static createSmsOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.SMS_OTP,
      secret: '', // 鐭俊 OTP 涓嶉渶瑕侀瀛樺瘑閽?      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 鍒涘缓澶囩敤鐮佺粦瀹氾紙涓嶉渶瑕?OTP 楠岃瘉锛?  static async createBackupCodeBinding(userId: string): Promise<MfaBindingEntity> {
    const backupCodes = this.generateBackupCodes()
    const hashedCodes = await Promise.all(backupCodes.map((code) => hash(code, 10)))

    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.BACKUP_CODE,
      secret: JSON.stringify(hashedCodes),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      backupCodes // 鏄庢枃澶囩敤鐮侊紝浠呯敤浜庡垵濮嬫樉绀?    })
  }

  // 妫€鏌ユ槸鍚﹂渶瑕?OTP 楠岃瘉
  static needsOtpVerification(type: MfaType): boolean {
    return type === MfaType.EMAIL_OTP || type === MfaType.SMS_OTP
  }

  // 妫€鏌ユ槸鍚﹀彲浠ョ洿鎺ョ粦瀹氾紙鏃犻渶 OTP 楠岃瘉锛?  static canBindDirectly(type: MfaType): boolean {
    return type === MfaType.TOTP || type === MfaType.BACKUP_CODE
  }

  // 楠岃瘉澶囩敤鐮?  async verifyBackupCode(inputCode: string): Promise<boolean> {
    if (this.props.type !== MfaType.BACKUP_CODE) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    if (!this.isEnabled()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_DISABLED)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hashedCodes: string[] = JSON.parse(this.props.secret)

    for (const hashedCode of hashedCodes) {
      if (await compare(inputCode, hashedCode)) {
        return true
      }
    }

    return false
  }

  // 楠岃瘉閫氱敤 MFA 浠ｇ爜锛堟牴鎹被鍨嬭嚜鍔ㄩ€夋嫨楠岃瘉鏂规硶锛?  async verify(inputCode: string, oneTimeToken?: OneTimeToken): Promise<boolean> {
    switch (this.props.type) {
      case MfaType.TOTP:
        return this.verifyTotp(inputCode)
      case MfaType.BACKUP_CODE:
        return this.verifyBackupCode(inputCode)
      case MfaType.EMAIL_OTP:
      case MfaType.SMS_OTP:
        // 杩欎簺绫诲瀷閫氳繃 OneTimeToken 楠岃瘉
        if (!oneTimeToken) {
          throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_OTP_TOKEN_REQUIRED)
        }
        return oneTimeToken.verify(inputCode)
      case MfaType.PUSH_NOTIFICATION:
      case MfaType.HARDWARE_TOKEN:
      case MfaType.BIOMETRIC:
        // 杩欎簺绫诲瀷闇€瑕佺壒娈婂鐞?        return true
      default:
        throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_NOT_SUPPORTED)
    }
  }

  // 鐢熸垚 TOTP 浜岀淮鐮?URL
  generateTotpUrl(issuer: string, accountName: string): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    return authenticator.keyuri(accountName, issuer, this.props.secret)
  }

  // 鐢熸垚澶囩敤鐮?  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // 鐢熸垚 8 浣嶆暟瀛楀鐢ㄧ爜
      const code = Math.floor(10000000 + Math.random() * 90000000).toString()
      codes.push(code)
    }
    return codes
  }

  // 鍚敤 MFA 缁戝畾
  enable() {
    this.props.enabled = true
    this.touch()
  }

  // 绂佺敤 MFA 缁戝畾
  disable() {
    this.props.enabled = false
    this.touch()
  }

  // 妫€鏌ユ槸鍚﹀惎鐢?  isEnabled(): boolean {
    return this.props.enabled
  }

  // 鑾峰彇 MFA 绫诲瀷
  getType(): MfaType {
    return this.props.type
  }

  // 鑾峰彇鐢ㄦ埛 ID
  getUserId(): string {
    return this.props.userId
  }

  // 鑾峰彇缁戝畾 ID
  getId(): string {
    return this.props.id
  }

  // 鑾峰彇璁惧淇℃伅
  getDeviceInfo(): DeviceInfo | undefined {
    return this.props.deviceInfo
  }

  // 鑾峰彇澶囩敤鐮侊紙浠呭湪鍒涘缓鏃跺彲鐢級
  getBackupCodes(): string[] | undefined {
    return this.props.backupCodes
  }

  // 鏇存柊鏈€鍚庢椿鍔ㄦ椂闂?  touch() {
    this.props.updatedAt = new Date()
  }

  // 鑾峰彇鎵€鏈夊睘鎬э紙鐢ㄤ簬鎸佷箙鍖栵級
  getProps(): Readonly<typeof this.props> {
    return { ...this.props }
  }

  // 鑾峰彇鐢ㄤ簬鏁版嵁搴撳瓨鍌ㄧ殑灞炴€?  getPrismaProps() {
    const { metadata, deviceInfo, ...prismaProps } = this.props
    return {
      ...prismaProps,
      metadata: metadata ? JSON.stringify(metadata) : null,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
    }
  }
}
