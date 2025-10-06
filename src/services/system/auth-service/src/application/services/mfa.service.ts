import { Injectable } from '@nestjs/common'
import { MfaBindingEntity } from '../../domain/aggregates/mfabinding.aggregate'
import { IMfaBindingRepository } from '../../domain/repositories/mfaBinding.repository'
import { IOtpRepository } from '../../domain/repositories/otp.repository'
import { ILoginMethodRepository } from '../../domain/repositories/loginmethod.repository'
import { EmailService } from '../../infrastructure/services/email.service'
import { SmsService } from '../../infrastructure/services/sms.service'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'
import { OTP_TYPES, MfaType } from '@oes/common/constants/const/auth-service.const'
import { OneTimeToken } from '../../domain/aggregates/otp.aggregate'

/**
 * MFA (Multi-Factor Authentication) 服务
 *
 * 提供多因素认证功能，支持以下认证方式：
 * - TOTP (基于时间的一次性密码)
 * - 邮箱验证码
 * - 短信验证码
 *
 * 使用场景：
 * - 用户登录时的二次验证
 * - 敏感操作的额外安全验证
 * - 账户安全设置
 */
@Injectable()
export class MfaService {
  constructor(
    private readonly mfaBindingRepo: IMfaBindingRepository,
    private readonly oneTimeTokenRepo: IOtpRepository,
    private readonly loginMethodRepo: ILoginMethodRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) {}

  // ==================== MFA 验证相关方法 ====================

  /**
   * 检查用户是否需要触发 MFA 验证
   *
   * 功能：检查用户是否已绑定任何活跃的 MFA 方式
   *
   * 使用场景：
   * - 用户登录时，判断是否需要额外的 MFA 验证
   * - 敏感操作前，检查用户的安全设置状态
   *
   * 示例：
   * ```typescript
   * const needsMfa = await mfaService.shouldTriggerMfa(userId);
   * if (needsMfa) {
   *   // 引导用户进行 MFA 验证
   * }
   * ```
   *
   * @param userId 用户ID
   * @returns Promise<boolean> 是否需要 MFA 验证
   */
  async shouldTriggerMfa(userId: string): Promise<boolean> {
    const bindings = await this.mfaBindingRepo.findAllByUserId(userId)
    return bindings.some((binding) => binding.isBindingActive())
  }

  /**
   * 生成一次性令牌
   *
   * 功能：为用户生成用于 MFA 验证的一次性令牌
   *
   * 使用场景：
   * - 用户登录时生成验证令牌
   * - 敏感操作前生成临时验证令牌
   *
   * 示例：
   * ```typescript
   * const token = await mfaService.generateOneTimeToken(userId);
   * // 将令牌发送给用户进行验证
   * ```
   *
   * @param userId 用户ID
   * @returns Promise<{tokenId: string, type: MfaType, identifier: string, expiresAt: Date}> 生成的一次性令牌
   */
  async generateOneTimeToken(userId: string): Promise<{
    tokenId: string
    type: MfaType
    identifier: string
    expiresAt: Date
  }> {
    // 获取用户的所有活跃 MFA 绑定
    const bindings = await this.mfaBindingRepo.findAllByUserId(userId)
    const activeBindings = bindings.filter((binding) => binding.isBindingActive())

    if (activeBindings.length === 0) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
    }

    // 优先选择 EMAIL_OTP 或 SMS_OTP 类型的绑定
    const preferredBinding =
      activeBindings.find(
        (binding) =>
          binding.getType() === MfaType.EMAIL_OTP || binding.getType() === MfaType.SMS_OTP
      ) || activeBindings[0]

    const bindingType = preferredBinding.getType()

    // 根据绑定类型生成相应的 OTP
    switch (bindingType) {
      case MfaType.EMAIL_OTP: {
        // 获取用户的邮箱
        const emailLoginMethod = await this.loginMethodRepo.findByUserIdAndType(userId, 'EMAIL')
        if (!emailLoginMethod) {
          throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
        }

        const otp = OneTimeToken.createMfaOtp({
          type: OTP_TYPES.EMAIL,
          identifier: emailLoginMethod.identifier,
          code: this.generateEmailCode(),
          expiredAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟过期
        })

        await this.oneTimeTokenRepo.save(otp)
        const sentCode = await this.emailService.sendEmailVerificationCode(
          emailLoginMethod.identifier,
          otp.getProps().code
        )
        // 在开发模式下，使用发送的验证码更新 OTP
        if (this.isDevelopmentMode()) {
          otp.updateCode(sentCode)
          await this.oneTimeTokenRepo.save(otp)
        }

        return {
          tokenId: otp.getProps().id,
          type: MfaType.EMAIL_OTP,
          identifier: emailLoginMethod.identifier,
          expiresAt: otp.getProps().expiredAt
        }
      }

      case MfaType.SMS_OTP: {
        // 获取用户的手机号
        const phoneLoginMethod = await this.loginMethodRepo.findByUserIdAndType(userId, 'PHONE')
        if (!phoneLoginMethod) {
          throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
        }

        const otp = OneTimeToken.createMfaOtp({
          type: OTP_TYPES.PHONE,
          identifier: phoneLoginMethod.identifier,
          code: this.generateSmsCode(),
          expiredAt: new Date(Date.now() + 5 * 60 * 1000) // 5分钟过期
        })

        await this.oneTimeTokenRepo.save(otp)
        const sentCode = await this.smsService.sendPhoneVerificationCode(
          phoneLoginMethod.identifier,
          otp.getProps().code
        )
        // 在开发模式下，使用发送的验证码更新 OTP
        if (this.isDevelopmentMode()) {
          otp.updateCode(sentCode)
          await this.oneTimeTokenRepo.save(otp)
        }

        return {
          tokenId: otp.getProps().id,
          type: MfaType.SMS_OTP,
          identifier: phoneLoginMethod.identifier,
          expiresAt: otp.getProps().expiredAt
        }
      }

      case MfaType.TOTP: {
        // TOTP 不需要生成 OTP，直接返回绑定信息
        return {
          tokenId: preferredBinding.getId(),
          type: MfaType.TOTP,
          identifier: userId,
          expiresAt: new Date(Date.now() + 30 * 1000) // TOTP 通常30秒有效
        }
      }

      default:
        throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_TYPE_NOT_SUPPORTED)
    }
  }

  /**
   * 验证 MFA 验证码
   *
   * 功能：验证用户输入的 MFA 验证码是否正确
   *
   * 使用场景：
   * - 验证用户输入的 TOTP 代码
   * - 验证邮箱或短信验证码
   *
   * 示例：
   * ```typescript
   * const isValid = await mfaService.verifyMfaCode(tokenId, userInputCode);
   * if (isValid) {
   *   // 验证成功，允许用户继续操作
   * }
   * ```
   *
   * @param tokenId 令牌ID
   * @param code 用户输入的验证码
   * @returns Promise<string | null> 验证成功返回用户ID，失败返回null
   */
  async verifyMfaCode(tokenId: string, code: string): Promise<string | null> {
    const token = await this.oneTimeTokenRepo.findById(tokenId)
    if (!token) return null

    // 验证 OTP 代码
    const isValid = token.verify(code)
    if (!isValid) {
      return null
    }

    // 标记 OTP 为已使用
    await this.oneTimeTokenRepo.markUsed(tokenId)

    // 从标识符中获取用户ID
    const identifier = token.getIdentifier()

    // 根据 OTP 类型获取用户ID
    if (token.getProps().type === OTP_TYPES.EMAIL) {
      return await this.getUserIdByEmail(identifier)
    } else if (token.getProps().type === OTP_TYPES.PHONE) {
      return await this.getUserIdByPhone(identifier)
    }

    return null
  }

  // ==================== TOTP 绑定相关方法 ====================

  /**
   * 开始 TOTP 绑定流程
   *
   * 功能：为用户创建 TOTP 绑定，生成二维码和密钥
   *
   * 使用场景：
   * - 用户首次设置 TOTP 认证器（如 Google Authenticator）
   * - 用户更换 TOTP 设备时重新绑定
   *
   * 示例：
   * ```typescript
   * const binding = await mfaService.startTotpBinding(
   *   userId,
   *   'MyApp',
   *   'user@example.com'
   * );
   * // 向用户展示 binding.qrCodeUrl 二维码
   * // 用户扫描二维码后输入 binding.testCode 进行验证
   * ```
   *
   * @param userId 用户ID
   * @param issuer 发行者名称（通常是应用名称）
   * @param accountName 账户名称（通常是用户邮箱）
   * @returns Promise<{bindingId, qrCodeUrl, secret, testCode}> 绑定信息
   */
  async startTotpBinding(
    userId: string,
    issuer: string,
    accountName: string
  ): Promise<{
    bindingId: string
    qrCodeUrl: string
    secret: string
    testCode: string
  }> {
    const existingBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    if (existingBinding && existingBinding.isBindingActive()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_ALREADY_EXISTS)
    }

    const binding = MfaBindingEntity.createTotpBinding(userId)
    const qrCodeUrl = binding.generateBindingQrCode(issuer, accountName)
    const testCode = binding.generateTestCode()

    await this.mfaBindingRepo.save(binding)

    return {
      bindingId: binding.getId(),
      qrCodeUrl,
      secret: binding.getSecret(),
      testCode
    }
  }

  /**
   * 验证并激活 TOTP 绑定
   *
   * 功能：验证用户输入的 TOTP 代码，如果正确则激活绑定
   *
   * 使用场景：
   * - 用户扫描二维码后，输入验证码确认绑定
   * - 验证 TOTP 设备是否正常工作
   *
   * 示例：
   * ```typescript
   * const isActivated = await mfaService.verifyAndActivateTotpBinding(
   *   bindingId,
   *   userInputCode
   * );
   * if (isActivated) {
   *   // 绑定成功，通知用户
   * }
   * ```
   *
   * @param bindingId 绑定ID
   * @param inputCode 用户输入的验证码
   * @returns Promise<boolean> 是否激活成功
   */
  async verifyAndActivateTotpBinding(bindingId: string, inputCode: string): Promise<boolean> {
    const binding = await this.mfaBindingRepo.findById(bindingId)
    if (!binding || binding.getType() !== MfaType.TOTP) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
    }

    if (binding.isBindingActive()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_ALREADY_EXISTS)
    }

    const isValid = binding.verifyTotpBinding(inputCode)
    if (isValid) {
      binding.activateTotpBinding()
      await this.mfaBindingRepo.save(binding)
      return true
    }
    return false
  }

  // ==================== 邮箱验证码 MFA 绑定相关方法 ====================

  /**
   * 开始邮箱验证码 MFA 绑定流程
   *
   * 功能：为用户创建基于邮箱验证码的 MFA 绑定
   *
   * 使用场景：
   * - 用户选择邮箱作为 MFA 方式
   * - 如果邮箱已验证，直接启用 MFA
   * - 如果邮箱未验证，发送验证码进行验证
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.startEmailMfaBinding(userId, 'user@example.com');
   * if (result.needsEmailVerification) {
   *   // 需要验证邮箱，用户输入验证码
   * } else {
   *   // 邮箱已验证，MFA 已启用
   * }
   * ```
   *
   * @param userId 用户ID
   * @param email 邮箱地址
   * @returns Promise<{bindingId?, otpTokenId?, needsEmailVerification, message}> 绑定结果
   */
  async startEmailMfaBinding(
    userId: string,
    email: string
  ): Promise<{
    bindingId?: string
    otpTokenId?: string
    needsEmailVerification: boolean
    message: string
  }> {
    const existingBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.EMAIL_OTP)
    if (existingBinding && existingBinding.isBindingActive()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_ALREADY_EXISTS)
    }

    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('EMAIL', email)
    const isEmailVerified = loginMethod?.isVerified() || false

    if (isEmailVerified) {
      const binding = MfaBindingEntity.createEmailOtpBinding(userId)
      await this.mfaBindingRepo.save(binding)

      return {
        bindingId: binding.getId(),
        needsEmailVerification: false,
        message: '邮箱已验证，MFA 绑定已启用'
      }
    } else {
      const otp = OneTimeToken.createMfaOtp({
        type: OTP_TYPES.EMAIL,
        identifier: email,
        code: this.generateEmailCode(),
        expiredAt: new Date(Date.now() + 5 * 60 * 1000)
      })

      await this.oneTimeTokenRepo.save(otp)
      const sentCode = await this.emailService.sendEmailVerificationCode(email, otp.getProps().code)
      // 在开发模式下，使用发送的验证码更新 OTP
      if (this.isDevelopmentMode()) {
        otp.updateCode(sentCode)
        await this.oneTimeTokenRepo.save(otp)
      }

      return {
        otpTokenId: otp.getProps().id,
        needsEmailVerification: true,
        message: '该邮箱尚未验证，请输入验证码以完成邮箱验证'
      }
    }
  }

  /**
   * 验证邮箱验证码
   *
   * 功能：验证用户输入的邮箱验证码，验证成功后启用 MFA 绑定
   *
   * 使用场景：
   * - 用户收到邮箱验证码后输入验证
   * - 验证成功后自动启用邮箱 MFA
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.verifyEmailCode(otpTokenId, userInputCode);
   * if (result.success) {
   *   // 验证成功，MFA 已启用
   * } else {
   *   // 验证失败，提示用户重试
   * }
   * ```
   *
   * @param otpTokenId OTP 令牌ID
   * @param inputCode 用户输入的验证码
   * @returns Promise<{success, bindingId?, message}> 验证结果
   */
  async verifyEmailCode(
    otpTokenId: string,
    inputCode: string
  ): Promise<{
    success: boolean
    bindingId?: string
    message: string
  }> {
    const otp = await this.oneTimeTokenRepo.findById(otpTokenId)
    if (!otp) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    }

    const isValid = otp.verify(inputCode)
    if (!isValid) {
      return {
        success: false,
        message: '验证码错误，请重试'
      }
    }

    const email = otp.getIdentifier()
    await this.markEmailAsVerified(email)

    const userId = await this.getUserIdByEmail(email)
    const binding = MfaBindingEntity.createEmailOtpBinding(userId)
    await this.mfaBindingRepo.save(binding)

    await this.oneTimeTokenRepo.markUsed(otpTokenId)

    return {
      success: true,
      bindingId: binding.getId(),
      message: '邮箱验证成功，MFA 绑定已启用'
    }
  }

  // ==================== 手机验证码 MFA 绑定相关方法 ====================

  /**
   * 开始手机验证码 MFA 绑定流程
   *
   * 功能：为用户创建基于手机验证码的 MFA 绑定
   *
   * 使用场景：
   * - 用户选择手机号作为 MFA 方式
   * - 如果手机号已验证，直接启用 MFA
   * - 如果手机号未验证，发送验证码进行验证
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.startSmsMfaBinding(userId, '+8613800138000');
   * if (result.needsPhoneVerification) {
   *   // 需要验证手机号，用户输入验证码
   * } else {
   *   // 手机号已验证，MFA 已启用
   * }
   * ```
   *
   * @param userId 用户ID
   * @param phone 手机号
   * @returns Promise<{bindingId?, otpTokenId?, needsPhoneVerification, message}> 绑定结果
   */
  async startSmsMfaBinding(
    userId: string,
    phone: string
  ): Promise<{
    bindingId?: string
    otpTokenId?: string
    needsPhoneVerification: boolean
    message: string
  }> {
    const existingBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.SMS_OTP)
    if (existingBinding && existingBinding.isBindingActive()) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_ALREADY_EXISTS)
    }

    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('PHONE', phone)
    const isPhoneVerified = loginMethod?.isVerified() || false

    if (isPhoneVerified) {
      const binding = MfaBindingEntity.createSmsOtpBinding(userId)
      await this.mfaBindingRepo.save(binding)

      return {
        bindingId: binding.getId(),
        needsPhoneVerification: false,
        message: '手机已验证，MFA 绑定已启用'
      }
    } else {
      const otp = OneTimeToken.createMfaOtp({
        type: OTP_TYPES.PHONE,
        identifier: phone,
        code: this.generateSmsCode(),
        expiredAt: new Date(Date.now() + 5 * 60 * 1000)
      })

      await this.oneTimeTokenRepo.save(otp)
      const sentCode = await this.smsService.sendPhoneVerificationCode(phone, otp.getProps().code)
      // 在开发模式下，使用发送的验证码更新 OTP
      if (this.isDevelopmentMode()) {
        otp.updateCode(sentCode)
        await this.oneTimeTokenRepo.save(otp)
      }

      return {
        otpTokenId: otp.getProps().id,
        needsPhoneVerification: true,
        message: '该手机号尚未验证，请输入验证码以完成手机验证'
      }
    }
  }

  /**
   * 验证手机验证码
   *
   * 功能：验证用户输入的手机验证码，验证成功后启用 MFA 绑定
   *
   * 使用场景：
   * - 用户收到短信验证码后输入验证
   * - 验证成功后自动启用手机 MFA
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.verifySmsCode(otpTokenId, userInputCode);
   * if (result.success) {
   *   // 验证成功，MFA 已启用
   * } else {
   *   // 验证失败，提示用户重试
   * }
   * ```
   *
   * @param otpTokenId OTP 令牌ID
   * @param inputCode 用户输入的验证码
   * @returns Promise<{success, bindingId?, message}> 验证结果
   */
  async verifySmsCode(
    otpTokenId: string,
    inputCode: string
  ): Promise<{
    success: boolean
    bindingId?: string
    message: string
  }> {
    const otp = await this.oneTimeTokenRepo.findById(otpTokenId)
    if (!otp) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    }

    const isValid = otp.verify(inputCode)
    if (!isValid) {
      return {
        success: false,
        message: '验证码错误，请重试'
      }
    }

    const phone = otp.getIdentifier()
    await this.markPhoneAsVerified(phone)

    const userId = await this.getUserIdByPhone(phone)
    const binding = MfaBindingEntity.createSmsOtpBinding(userId)
    await this.mfaBindingRepo.save(binding)

    await this.oneTimeTokenRepo.markUsed(otpTokenId)

    return {
      success: true,
      bindingId: binding.getId(),
      message: '手机验证成功，MFA 绑定已启用'
    }
  }

  // ==================== 通用方法 ====================

  /**
   * 重新发送邮箱验证码
   *
   * 功能：重新生成并发送邮箱验证码
   *
   * 使用场景：
   * - 用户未收到验证码时重新发送
   * - 验证码过期后重新发送
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.resendEmailVerificationCode(otpTokenId);
   * if (result.success) {
   *   // 验证码已重新发送
   * }
   * ```
   *
   * @param otpTokenId OTP 令牌ID
   * @returns Promise<{success, message}> 重发结果
   */
  async resendEmailVerificationCode(
    otpTokenId: string
  ): Promise<{ success: boolean; message: string }> {
    const otp = await this.oneTimeTokenRepo.findById(otpTokenId)
    if (!otp) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    }

    const newCode = this.generateEmailCode()
    otp.updateCode(newCode)
    await this.oneTimeTokenRepo.save(otp)
    const sentCode = await this.emailService.sendEmailVerificationCode(otp.getIdentifier(), newCode)
    // 在开发模式下，使用发送的验证码更新 OTP
    if (this.isDevelopmentMode()) {
      otp.updateCode(sentCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    return {
      success: true,
      message: '验证码已重新发送'
    }
  }

  /**
   * 重新发送手机验证码
   *
   * 功能：重新生成并发送手机验证码
   *
   * 使用场景：
   * - 用户未收到短信验证码时重新发送
   * - 验证码过期后重新发送
   *
   * 示例：
   * ```typescript
   * const result = await mfaService.resendSmsVerificationCode(otpTokenId);
   * if (result.success) {
   *   // 验证码已重新发送
   * }
   * ```
   *
   * @param otpTokenId OTP 令牌ID
   * @returns Promise<{success, message}> 重发结果
   */
  async resendSmsVerificationCode(
    otpTokenId: string
  ): Promise<{ success: boolean; message: string }> {
    const otp = await this.oneTimeTokenRepo.findById(otpTokenId)
    if (!otp) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.OTP_INVALID)
    }

    const newCode = this.generateSmsCode()
    otp.updateCode(newCode)
    await this.oneTimeTokenRepo.save(otp)
    const sentCode = await this.smsService.sendPhoneVerificationCode(otp.getIdentifier(), newCode)
    // 在开发模式下，使用发送的验证码更新 OTP
    if (this.isDevelopmentMode()) {
      otp.updateCode(sentCode)
      await this.oneTimeTokenRepo.save(otp)
    }

    return {
      success: true,
      message: '验证码已重新发送'
    }
  }

  /**
   * 获取 MFA 绑定状态
   *
   * 功能：获取用户所有 MFA 方式的绑定状态
   *
   * 使用场景：
   * - 用户查看自己的 MFA 设置状态
   * - 管理员查看用户的安全设置
   * - 前端展示 MFA 设置界面
   *
   * 示例：
   * ```typescript
   * const status = await mfaService.getMfaStatus(userId);
   * if (status.totp.hasActiveBinding) {
   *   // 用户已绑定 TOTP
   * }
   * if (status.email.hasActiveBinding) {
   *   // 用户已绑定邮箱 MFA
   * }
   * ```
   *
   * @param userId 用户ID
   * @returns Promise<{totp, email, sms}> MFA 状态信息
   */
  async getMfaStatus(userId: string): Promise<{
    totp: { hasActiveBinding: boolean; bindingId?: string }
    email: {
      hasActiveBinding: boolean
      bindingId?: string
      isEmailVerified: boolean
    }
    sms: {
      hasActiveBinding: boolean
      bindingId?: string
      isPhoneVerified: boolean
    }
  }> {
    const totpBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.TOTP)
    const emailBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.EMAIL_OTP)
    const smsBinding = await this.mfaBindingRepo.findByUserIdAndType(userId, MfaType.SMS_OTP)

    const emailLoginMethod = await this.loginMethodRepo.findByUserIdAndType(userId, 'EMAIL')
    const phoneLoginMethod = await this.loginMethodRepo.findByUserIdAndType(userId, 'PHONE')

    return {
      totp: {
        hasActiveBinding: totpBinding ? totpBinding.isBindingActive() : false,
        bindingId: totpBinding?.getId()
      },
      email: {
        hasActiveBinding: emailBinding ? emailBinding.isBindingActive() : false,
        bindingId: emailBinding?.getId(),
        isEmailVerified: emailLoginMethod?.isVerified() || false
      },
      sms: {
        hasActiveBinding: smsBinding ? smsBinding.isBindingActive() : false,
        bindingId: smsBinding?.getId(),
        isPhoneVerified: phoneLoginMethod?.isVerified() || false
      }
    }
  }

  /**
   * 取消 MFA 绑定
   *
   * 功能：删除用户的 MFA 绑定
   *
   * 使用场景：
   * - 用户取消某种 MFA 方式
   * - 用户更换设备时删除旧绑定
   * - 管理员强制删除用户的 MFA 绑定
   *
   * 示例：
   * ```typescript
   * await mfaService.cancelMfaBinding(bindingId, MfaType.TOTP);
   * // 绑定已删除
   * ```
   *
   * @param bindingId 绑定ID
   * @param type MFA 类型
   * @returns Promise<void>
   */
  async cancelMfaBinding(bindingId: string, type: MfaType): Promise<void> {
    const binding = await this.mfaBindingRepo.findById(bindingId)
    if (!binding || binding.getType() !== type) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
    }

    await this.mfaBindingRepo.delete(bindingId)
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 生成邮箱验证码
   *
   * 功能：生成6位数字的邮箱验证码
   *
   * 使用场景：
   * - 邮箱 MFA 绑定时生成验证码
   * - 重新发送邮箱验证码时生成新验证码
   *
   * @returns string 6位数字验证码
   */
  private generateEmailCode(): string {
    // 开发测试阶段：使用硬编码验证码
    if (this.isDevelopmentMode()) {
      return this.emailService.getDevEmailCode()
    }
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 生成短信验证码
   *
   * 功能：生成6位数字的短信验证码
   *
   * 使用场景：
   * - 手机 MFA 绑定时生成验证码
   * - 重新发送短信验证码时生成新验证码
   *
   * @returns string 6位数字验证码
   */
  private generateSmsCode(): string {
    // 开发测试阶段：使用硬编码验证码
    if (this.isDevelopmentMode()) {
      return this.smsService.getDevSmsCode()
    }
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 检查是否为开发模式
   * @returns boolean
   */
  private isDevelopmentMode(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  }

  /**
   * 标记邮箱为已验证
   *
   * 功能：将用户的邮箱标记为已验证状态
   *
   * 使用场景：
   * - 邮箱验证码验证成功后标记邮箱状态
   * - 确保后续 MFA 绑定流程正常进行
   *
   * @param email 邮箱地址
   * @returns Promise<void>
   */
  private async markEmailAsVerified(email: string): Promise<void> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('EMAIL', email)
    if (loginMethod) {
      // 使用领域实体的方法
      loginMethod.verify()
      await this.loginMethodRepo.save(loginMethod)
    }
  }

  /**
   * 标记手机号为已验证
   *
   * 功能：将用户的手机号标记为已验证状态
   *
   * 使用场景：
   * - 手机验证码验证成功后标记手机号状态
   * - 确保后续 MFA 绑定流程正常进行
   *
   * @param phone 手机号
   * @returns Promise<void>
   */
  private async markPhoneAsVerified(phone: string): Promise<void> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('PHONE', phone)
    if (loginMethod) {
      // 使用领域实体的方法
      loginMethod.verify()
      await this.loginMethodRepo.save(loginMethod)
    }
  }

  /**
   * 根据邮箱获取用户ID
   *
   * 功能：通过邮箱地址查找对应的用户ID
   *
   * 使用场景：
   * - 邮箱验证成功后获取用户ID进行 MFA 绑定
   * - 邮箱相关的用户操作
   *
   * @param email 邮箱地址
   * @returns Promise<string> 用户ID
   */
  private async getUserIdByEmail(email: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('EMAIL', email)
    if (!loginMethod) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }

  /**
   * 根据手机号获取用户ID
   *
   * 功能：通过手机号查找对应的用户ID
   *
   * 使用场景：
   * - 手机验证成功后获取用户ID进行 MFA 绑定
   * - 手机号相关的用户操作
   *
   * @param phone 手机号
   * @returns Promise<string> 用户ID
   */
  private async getUserIdByPhone(phone: string): Promise<string> {
    const loginMethod = await this.loginMethodRepo.findByTypeAndIdentifier('PHONE', phone)
    if (!loginMethod) {
      throw createBusinessException(AUTH_SERVICE_ERRORS.MFA_BINDING_NOT_FOUND)
    }
    return loginMethod.userId
  }
}
