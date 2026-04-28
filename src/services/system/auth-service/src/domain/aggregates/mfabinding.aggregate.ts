import { compare, hash } from 'bcrypt'
import { randomUUID } from 'crypto'
import { authenticator } from 'otplib'
import { MfaType } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AUTH_MFA_DISABLED,
  AUTH_MFA_OTP_TOKEN_REQUIRED,
  AUTH_MFA_TYPE_MISMATCH,
  AUTH_MFA_TYPE_NOT_SUPPORTED
} from '../../common/constants/exception-enums'
import { OneTimeToken } from './otp.aggregate'

export interface DeviceInfo {
  deviceId: string
  deviceName: string
  userAgent: string
  ipAddress: string
}

const SEEDED_TEST_TOTP_CODE_KEY = 'seededTestCode'
const TOTP_VERIFICATION_WINDOW = 1

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
      metadata?: Record<string, unknown>
      backupCodes?: string[]
      deviceInfo?: DeviceInfo
    }
  ) {}

  static createTotpBinding(userId: string, deviceInfo?: DeviceInfo): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.TOTP,
      secret: authenticator.generateSecret(),
      enabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deviceInfo
    })
  }

  static createSeededTestTotpBinding(userId: string, fixedCode = '123456'): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.TOTP,
      secret: authenticator.generateSecret(),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        [SEEDED_TEST_TOTP_CODE_KEY]: fixedCode
      }
    })
  }

  static createEmailOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.EMAIL_OTP,
      secret: '',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static createSmsOtpBinding(userId: string): MfaBindingEntity {
    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.SMS_OTP,
      secret: '',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static async createBackupCodeBinding(userId: string): Promise<MfaBindingEntity> {
    const { rawCodes, hashedCodes } = await this.issueBackupCodes()

    return new MfaBindingEntity({
      id: randomUUID(),
      userId,
      type: MfaType.BACKUP_CODE,
      secret: JSON.stringify(hashedCodes),
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      backupCodes: rawCodes
    })
  }

  static async issueBackupCodes(): Promise<{ rawCodes: string[]; hashedCodes: string[] }> {
    const rawCodes = Array.from({ length: 10 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString()
    )
    const hashedCodes = await Promise.all(rawCodes.map((code) => hash(code, 10)))

    return { rawCodes, hashedCodes }
  }

  static needsOtpVerification(type: MfaType): boolean {
    return type === MfaType.EMAIL_OTP || type === MfaType.SMS_OTP
  }

  static canBindDirectly(type: MfaType): boolean {
    return type === MfaType.TOTP || type === MfaType.BACKUP_CODE
  }

  generateBindingQrCode(issuer: string, accountName: string): string {
    if (this.props.type !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    return authenticator.keyuri(accountName, issuer, this.props.secret)
  }

  generateTotpUrl(issuer: string, accountName: string): string {
    return this.generateBindingQrCode(issuer, accountName)
  }

  generateTestCode(): string {
    if (this.props.type !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    return authenticator.generate(this.props.secret)
  }

  verifyTotpBinding(inputCode: string): boolean {
    if (this.props.type !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    if (this.isSeededTestBinding()) {
      return false
    }
    const normalizedCode = normalizeTotpCode(inputCode)
    return verifyTotpCode(normalizedCode, this.props.secret)
  }

  activateTotpBinding(): void {
    if (this.props.type !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    this.enable()
  }

  verifyTotp(inputCode: string): boolean {
    if (this.props.type !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    if (!this.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_DISABLED)
    }
    if (this.isSeededTestBinding()) {
      return false
    }
    const normalizedCode = normalizeTotpCode(inputCode)
    return verifyTotpCode(normalizedCode, this.props.secret)
  }

  isSeededTestBinding(): boolean {
    const seededCode = this.props.metadata?.[SEEDED_TEST_TOTP_CODE_KEY]
    return this.props.type === MfaType.TOTP && typeof seededCode === 'string' && seededCode.length > 0
  }

  async verifyBackupCode(inputCode: string): Promise<boolean> {
    if (this.props.type !== MfaType.BACKUP_CODE) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    if (!this.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_DISABLED)
    }

    const hashedCodes = JSON.parse(this.props.secret) as string[]
    for (const hashedCode of hashedCodes) {
      if (await compare(inputCode, hashedCode)) {
        return true
      }
    }
    return false
  }

  async consumeBackupCode(inputCode: string): Promise<boolean> {
    if (this.props.type !== MfaType.BACKUP_CODE) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }
    if (!this.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_DISABLED)
    }

    const hashedCodes = JSON.parse(this.props.secret) as string[]
    for (let index = 0; index < hashedCodes.length; index += 1) {
      if (await compare(inputCode, hashedCodes[index])) {
        const remainingCodes = hashedCodes.filter((_, currentIndex) => currentIndex !== index)
        this.props.secret = JSON.stringify(remainingCodes)
        this.props.enabled = remainingCodes.length > 0
        this.touch()
        return true
      }
    }

    return false
  }

  invalidateBackupCodes(): void {
    if (this.props.type !== MfaType.BACKUP_CODE) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }

    this.props.secret = JSON.stringify([])
    this.props.enabled = false
    this.touch()
  }

  async regenerateBackupCodes(): Promise<string[]> {
    if (this.props.type !== MfaType.BACKUP_CODE) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_MISMATCH)
    }

    const { rawCodes, hashedCodes } = await MfaBindingEntity.issueBackupCodes()
    this.props.secret = JSON.stringify(hashedCodes)
    this.props.backupCodes = rawCodes
    this.props.enabled = true
    this.touch()
    return rawCodes
  }

  async verify(inputCode: string, oneTimeToken?: OneTimeToken): Promise<boolean> {
    switch (this.props.type) {
      case MfaType.TOTP:
        return this.verifyTotp(inputCode)
      case MfaType.BACKUP_CODE:
        return this.verifyBackupCode(inputCode)
      case MfaType.EMAIL_OTP:
      case MfaType.SMS_OTP:
        if (!oneTimeToken) {
          throw ExceptionFactory.domain(AUTH_MFA_OTP_TOKEN_REQUIRED)
        }
        return oneTimeToken.verify(inputCode)
      default:
        throw ExceptionFactory.domain(AUTH_MFA_TYPE_NOT_SUPPORTED)
    }
  }

  getBindingInfo(
    issuer: string,
    accountName: string
  ): { qrCodeUrl: string; secret: string; testCode: string } {
    return {
      qrCodeUrl: this.generateBindingQrCode(issuer, accountName),
      secret: this.getSecret(),
      testCode: this.generateTestCode()
    }
  }

  enable(): void {
    this.props.enabled = true
    this.touch()
  }

  disable(): void {
    this.props.enabled = false
    this.touch()
  }

  isEnabled(): boolean {
    return this.props.enabled
  }

  isBindingActive(): boolean {
    return this.props.enabled
  }

  getType(): MfaType {
    return this.props.type
  }

  getUserId(): string {
    return this.props.userId
  }

  getId(): string {
    return this.props.id
  }

  getSecret(): string {
    return this.props.secret
  }

  getDeviceInfo(): DeviceInfo | undefined {
    return this.props.deviceInfo
  }

  getBackupCodes(): string[] | undefined {
    return this.props.backupCodes
  }

  touch(): void {
    this.props.updatedAt = new Date()
  }

  getProps(): Readonly<typeof this.props> {
    return { ...this.props }
  }

  getPrismaProps(): Record<string, unknown> {
    return {
      ...this.props,
      metadata: this.props.metadata ? JSON.stringify(this.props.metadata) : null,
      deviceInfo: this.props.deviceInfo ? JSON.stringify(this.props.deviceInfo) : null
    }
  }
}

function normalizeTotpCode(inputCode: string): string {
  return inputCode.replace(/\s+/g, '').trim()
}

function verifyTotpCode(token: string, secret: string): boolean {
  const verifier = authenticator.clone()
  verifier.options = {
    ...verifier.options,
    window: TOTP_VERIFICATION_WINDOW
  }

  return verifier.verify({ token, secret })
}
