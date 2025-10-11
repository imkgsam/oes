import { MfaBinding as PrismaMfaBinding } from '../../../prisma/generated/prisma'
import { MfaType } from '@oes/common/constants/const/auth-service.const'
import {
  createSystemException,
  createBusinessException
} from '@oes/common/exceptions/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'
import { authenticator } from 'otplib' //是一个用于生成和验证一次性密码（OTP）的 JavaScript 库，主要用于实现多因素认证（MFA）功能。
import { compare, hash } from 'bcrypt'
import { randomUUID } from 'crypto'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants/res-codes/system.errors'
import { OneTimeToken } from './otp.aggregate'

// 设备信息接口
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
      // 扩展字段，用于不同类型 MFA 的特定配置
      metadata?: Record<string, any>
      backupCodes?: string[] // 备用码，用于 BACKUP_CODE 类型
      deviceInfo?: DeviceInfo
    }
  ) {}

  // 从 Prisma 模型创建 MfaBindingEntity
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

  // 创建新的 TOTP 绑定（步骤 1-2：用户发起绑定请求，后端生成密钥）
  static createTotpBinding(userId: string, deviceInfo?: DeviceInfo): MfaBindingEntity {
    const secret = authenticator.generateSecret() // 步骤 2：生成密钥
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.TOTP,
      secret,
      enabled: false, // 初始状态为禁用，验证后启用
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceInfo
    })
  }

  // 生成绑定二维码（步骤 3：生成绑定二维码）
  generateBindingQrCode(issuer: string, accountName: string): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 生成 OTPAuth URI 格式的二维码
    return authenticator.keyuri(accountName, issuer, this.props.secret)
  }

  // 生成测试验证码（步骤 4-5：用户扫码后，生成测试码供用户输入）
  generateTestCode(): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 生成当前时间窗口的验证码
    return authenticator.generate(this.props.secret)
  }

  // 验证 TOTP 绑定（步骤 6：后端校验验证码）
  verifyTotpBinding(inputCode: string): boolean {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    // 验证用户输入的验证码是否正确
    return authenticator.verify({
      token: inputCode,
      secret: this.props.secret
    })
  }

  // 激活 TOTP 绑定（步骤 7：绑定成功并保存密钥）
  activateTotpBinding(): void {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    this.props.enabled = true
    this.touch()
  }

  // 验证 TOTP 代码（用于登录时的验证）
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

  // 获取 TOTP 密钥（用于生成测试代码）
  getSecret(): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    return this.props.secret
  }

  // 检查绑定状态
  isBindingActive(): boolean {
    return this.props.enabled
  }

  // 获取绑定信息（用于前端显示）
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

  // 创建邮箱 OTP 绑定（需要 OTP 验证）
  static createEmailOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.EMAIL_OTP,
      secret: '', // 邮箱 OTP 不需要预存密钥
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 创建短信 OTP 绑定（需要 OTP 验证）
  static createSmsOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.SMS_OTP,
      secret: '', // 短信 OTP 不需要预存密钥
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  // 创建备用码绑定（不需要 OTP 验证）
  static async createBackupCodeBinding(userId: string): Promise<MfaBindingEntity> {
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
      backupCodes // 明文备用码，仅用于初始显示
    })
  }

  // 检查是否需要 OTP 验证
  static needsOtpVerification(type: MfaType): boolean {
    return type === MfaType.EMAIL_OTP || type === MfaType.SMS_OTP
  }

  // 检查是否可以直接绑定（无需 OTP 验证）
  static canBindDirectly(type: MfaType): boolean {
    return type === MfaType.TOTP || type === MfaType.BACKUP_CODE
  }

  // 验证备用码
  async verifyBackupCode(inputCode: string): Promise<boolean> {
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

  // 验证通用 MFA 代码（根据类型自动选择验证方法）
  async verify(inputCode: string, oneTimeToken?: OneTimeToken): Promise<boolean> {
    switch (this.props.type) {
      case MfaType.TOTP:
        return this.verifyTotp(inputCode)
      case MfaType.BACKUP_CODE:
        return this.verifyBackupCode(inputCode)
      case MfaType.EMAIL_OTP:
      case MfaType.SMS_OTP:
        // 这些类型通过 OneTimeToken 验证
        if (!oneTimeToken) {
          throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_OTP_TOKEN_REQUIRED)
        }
        return oneTimeToken.verify(inputCode)
      case MfaType.PUSH_NOTIFICATION:
      case MfaType.HARDWARE_TOKEN:
      case MfaType.BIOMETRIC:
        // 这些类型需要特殊处理
        return true
      default:
        throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_NOT_SUPPORTED)
    }
  }

  // 生成 TOTP 二维码 URL
  generateTotpUrl(issuer: string, accountName: string): string {
    if (this.props.type !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_MISMATCH)
    }

    return authenticator.keyuri(accountName, issuer, this.props.secret)
  }

  // 生成备用码
  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // 生成 8 位数字备用码
      const code = Math.floor(10000000 + Math.random() * 90000000).toString()
      codes.push(code)
    }
    return codes
  }

  // 启用 MFA 绑定
  enable() {
    this.props.enabled = true
    this.touch()
  }

  // 禁用 MFA 绑定
  disable() {
    this.props.enabled = false
    this.touch()
  }

  // 检查是否启用
  isEnabled(): boolean {
    return this.props.enabled
  }

  // 获取 MFA 类型
  getType(): MfaType {
    return this.props.type
  }

  // 获取用户 ID
  getUserId(): string {
    return this.props.userId
  }

  // 获取绑定 ID
  getId(): string {
    return this.props.id
  }

  // 获取设备信息
  getDeviceInfo(): DeviceInfo | undefined {
    return this.props.deviceInfo
  }

  // 获取备用码（仅在创建时可用）
  getBackupCodes(): string[] | undefined {
    return this.props.backupCodes
  }

  // 更新最后活动时间
  touch() {
    this.props.updatedAt = new Date()
  }

  // 获取所有属性（用于持久化）
  getProps(): Readonly<typeof this.props> {
    return { ...this.props }
  }

  // 获取用于数据库存储的属性
  getPrismaProps() {
    const { metadata, deviceInfo, ...prismaProps } = this.props
    return {
      ...prismaProps,
      metadata: metadata ? JSON.stringify(metadata) : null,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null
    }
  }
}
