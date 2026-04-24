import { Inject, Injectable } from '@nestjs/common'
import { LoginMethodType, MfaType, REPO } from '../../../common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CredentialType } from '../../../../prisma/generated/prisma'
import {
  AUTH_MFA_BINDING_ALREADY_EXISTS,
  AUTH_MFA_BINDING_NOT_FOUND,
  AUTH_MFA_INVALID_CODE,
  AUTH_MFA_LOGIN_METHOD_UNAVAILABLE,
  AUTH_MFA_RECOVERY_CODES_REQUIRE_TOTP,
  AUTH_MFA_TYPE_NOT_SUPPORTED
} from '../../../common/constants/exception-enums'
import { MfaBindingEntity } from '../../../domain/aggregates/mfabinding.aggregate'
import { IMfaBindingRepository } from '../../../domain/repositories/mfaBinding.repository'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'

export type ManagedMfaType =
  | MfaType.EMAIL_OTP
  | MfaType.SMS_OTP
  | MfaType.TOTP
  | MfaType.BACKUP_CODE

export interface MfaBindingView {
  bindingId: string
  type: ManagedMfaType
  enabled: boolean
  available: boolean
  destination: string
  updatedAt?: Date
}

export interface TotpBindingInitialization {
  binding: MfaBindingView
  secret: string
  qrCodeUrl: string
}

export interface RecoveryCodeInitialization {
  binding: MfaBindingView
  recoveryCodes: string[]
}

@Injectable()
export class MfaBindingManagementService {
  constructor(
    @Inject(REPO.MFA_BINDING)
    private readonly mfaBindingRepo: IMfaBindingRepository,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepo: ILoginMethodRepository
  ) {}

  async listBindings(userId: string): Promise<MfaBindingView[]> {
    const [email, sms, totp, backupCode] = await Promise.all([
      this.buildView(userId, MfaType.EMAIL_OTP),
      this.buildView(userId, MfaType.SMS_OTP),
      this.buildTotpView(userId),
      this.buildBackupCodeView(userId)
    ])

    return [email, sms, totp, backupCode]
  }

  async enableOtpBinding(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ): Promise<MfaBindingView> {
    const loginMethod = await this.getRequiredLoginMethod(userId, type)
    const existing = await this.mfaBindingRepo.findByUserIdAndType(userId, type)

    const binding = existing ?? this.createBinding(userId, type)
    if (!binding.isEnabled()) {
      binding.enable()
      await this.mfaBindingRepo.save(binding)
    } else if (!existing) {
      await this.mfaBindingRepo.save(binding)
    }

    return this.toView(binding, loginMethod.identifier, true)
  }

  async disableOtpBinding(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ): Promise<MfaBindingView> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, type)
    if (!binding) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND, { userId, type })
    }

    if (binding.isEnabled()) {
      binding.disable()
      await this.mfaBindingRepo.save(binding)
    }

    const loginMethod = await this.findAvailableLoginMethod(userId, type)
    return this.toView(binding, loginMethod?.identifier ?? '', Boolean(loginMethod))
  }

  async initializeTotpBinding(userId: string): Promise<TotpBindingInitialization> {
    const existing = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    if (existing?.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_ALREADY_EXISTS, {
        userId,
        type: MfaType.TOTP
      })
    }

    const binding = existing ?? MfaBindingEntity.createTotpBinding(userId)
    if (!existing) {
      await this.mfaBindingRepo.save(binding)
    }

    const accountName = await this.resolveTotpAccountName(userId)

    return {
      binding: this.toView(binding, '', true, MfaType.TOTP),
      secret: binding.getSecret(),
      qrCodeUrl: binding.generateTotpUrl('OES', accountName)
    }
  }

  async activateTotpBinding(
    userId: string,
    bindingId: string,
    code: string
  ): Promise<MfaBindingView> {
    const binding = await this.mfaBindingRepo.findById(bindingId)
    if (!binding || binding.getUserId() !== userId || binding.getType() !== MfaType.TOTP) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND, { userId, bindingId, type: MfaType.TOTP })
    }

    if (!binding.verifyTotpBinding(code)) {
      throw ExceptionFactory.domain(AUTH_MFA_INVALID_CODE, { userId, bindingId })
    }

    binding.activateTotpBinding()
    await this.mfaBindingRepo.save(binding)

    return this.toView(binding, '', true, MfaType.TOTP)
  }

  async initializeRecoveryCodes(userId: string): Promise<RecoveryCodeInitialization> {
    await this.assertActiveTotpBinding(userId)

    const existing = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.BACKUP_CODE)
    if (existing?.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_ALREADY_EXISTS, {
        userId,
        type: MfaType.BACKUP_CODE
      })
    }

    const binding = existing ?? (await MfaBindingEntity.createBackupCodeBinding(userId))
    const recoveryCodes =
      existing ? await binding.regenerateBackupCodes() : (binding.getBackupCodes() ?? [])

    await this.mfaBindingRepo.save(binding)

    return {
      binding: this.toView(binding, '', true, MfaType.BACKUP_CODE),
      recoveryCodes
    }
  }

  async regenerateRecoveryCodes(userId: string): Promise<RecoveryCodeInitialization> {
    await this.assertActiveTotpBinding(userId)

    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.BACKUP_CODE)
    if (!binding) {
      throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND, {
        userId,
        type: MfaType.BACKUP_CODE
      })
    }

    const recoveryCodes = await binding.regenerateBackupCodes()
    await this.mfaBindingRepo.save(binding)

    return {
      binding: this.toView(binding, '', true, MfaType.BACKUP_CODE),
      recoveryCodes
    }
  }

  async disableBinding(userId: string, type: ManagedMfaType): Promise<MfaBindingView> {
    if (type === MfaType.TOTP || type === MfaType.BACKUP_CODE) {
      const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, type)
      if (!binding) {
        throw ExceptionFactory.domain(AUTH_MFA_BINDING_NOT_FOUND, { userId, type })
      }

      if (binding.isEnabled()) {
        binding.disable()
        await this.mfaBindingRepo.save(binding)
      }

      return this.toView(binding, '', true, type)
    }

    return this.disableOtpBinding(userId, type)
  }

  private async buildView(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ): Promise<MfaBindingView> {
    const [binding, loginMethod] = await Promise.all([
      this.mfaBindingRepo.findByUserIdAndType(userId, type),
      this.findAvailableLoginMethod(userId, type)
    ])

    return this.toView(binding, loginMethod?.identifier ?? '', Boolean(loginMethod), type)
  }

  private async buildTotpView(userId: string): Promise<MfaBindingView> {
    const binding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    return this.toView(binding, '', true, MfaType.TOTP)
  }

  private async buildBackupCodeView(userId: string): Promise<MfaBindingView> {
    const [binding, totpBinding] = await Promise.all([
      this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.BACKUP_CODE),
      this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    ])

    return this.toView(
      binding,
      '',
      Boolean(totpBinding?.isEnabled()),
      MfaType.BACKUP_CODE
    )
  }

  private async assertActiveTotpBinding(userId: string): Promise<void> {
    const totpBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    if (!totpBinding?.isEnabled()) {
      throw ExceptionFactory.domain(AUTH_MFA_RECOVERY_CODES_REQUIRE_TOTP, { userId })
    }
  }

  private async resolveTotpAccountName(userId: string): Promise<string> {
    const emailLoginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      LoginMethodType.EMAIL
    )

    if (emailLoginMethod?.isEnabled() && emailLoginMethod.isVerified()) {
      return emailLoginMethod.identifier
    }

    return userId
  }

  private async getRequiredLoginMethod(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ) {
    const loginMethod = await this.findAvailableLoginMethod(userId, type)
    if (!loginMethod) {
      throw ExceptionFactory.domain(AUTH_MFA_LOGIN_METHOD_UNAVAILABLE, { userId, type })
    }
    return loginMethod
  }

  private async findAvailableLoginMethod(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ) {
    const loginMethod = await this.loginMethodRepo.findByUserIdAndType(
      userId,
      this.toLoginMethodType(type)
    )

    if (!loginMethod || !loginMethod.isEnabled() || !loginMethod.isVerified()) {
      return null
    }

    const otpCredential = loginMethod.getCredentialByType(resolveOtpCredentialType(type))
    if (otpCredential && !otpCredential.isEnabled()) {
      return null
    }

    return loginMethod
  }

  private createBinding(
    userId: string,
    type: MfaType.EMAIL_OTP | MfaType.SMS_OTP
  ): MfaBindingEntity {
    if (type === MfaType.EMAIL_OTP) {
      return MfaBindingEntity.createEmailOtpBinding(userId)
    }

    if (type === MfaType.SMS_OTP) {
      return MfaBindingEntity.createSmsOtpBinding(userId)
    }

    throw ExceptionFactory.domain(AUTH_MFA_TYPE_NOT_SUPPORTED, { type })
  }

  private toLoginMethodType(type: MfaType.EMAIL_OTP | MfaType.SMS_OTP): LoginMethodType {
    if (type === MfaType.EMAIL_OTP) {
      return LoginMethodType.EMAIL
    }

    if (type === MfaType.SMS_OTP) {
      return LoginMethodType.PHONE
    }

    throw ExceptionFactory.domain(AUTH_MFA_TYPE_NOT_SUPPORTED, { type })
  }

  private toView(
    binding: MfaBindingEntity | null,
    destination: string,
    available: boolean,
    fallbackType?: ManagedMfaType
  ): MfaBindingView {
    const type = (binding?.getType() as ManagedMfaType | undefined) ?? fallbackType
    if (!type) {
      throw ExceptionFactory.domain(AUTH_MFA_TYPE_NOT_SUPPORTED)
    }

    return {
      bindingId: binding?.getId() ?? '',
      type,
      enabled: binding?.isEnabled() ?? false,
      available,
      destination,
      updatedAt: binding?.getProps().updatedAt
    }
  }
}

// Resolves the OTP credential flag that gates one OTP-capable MFA method.
function resolveOtpCredentialType(type: MfaType.EMAIL_OTP | MfaType.SMS_OTP): CredentialType {
  return type === MfaType.EMAIL_OTP ? CredentialType.EMAIL_OTP : CredentialType.PHONE_OTP
}
