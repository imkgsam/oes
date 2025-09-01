import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { AuthResult } from './interfaces/auth-provider.interface'
import { EmailOtpLoginDto, PhoneOtpLoginDto } from '../dtos/login.dto'
import { BaseAuthProvider } from './base-auth.provider'
import { IOtpRepository } from 'src/domain/repositories/otp.repository'
import { OneTimeToken } from 'src/domain/entities/otp.entity'
import {
  LOGIN_METHOD_TYPES,
  OTP_TYPES,
  OTP_USAGES
} from '@oes/common/constants/enums/auth-service.enums'
import { LoginMethodEnum } from '@oes/common/constants/enums/auth-service.enums'

@Injectable()
export class EmailOtpProvider extends BaseAuthProvider<EmailOtpLoginDto> {
  constructor(
    loginMethodRepository: any,
    private readonly otpRepository: IOtpRepository
  ) {
    super(loginMethodRepository, LoginMethodEnum.EmailOtp)
  }

  async authenticate(dto: EmailOtpLoginDto): Promise<AuthResult> {
    // 验证输入参数
    if (!this.validateInput(dto) || !dto.email || !dto.otp) {
      throw new BadRequestException('Email and OTP are required')
    }

    try {
      // 查找并验证登录方法
      const loginMethod = await this.findAndValidateLoginMethod(LOGIN_METHOD_TYPES.EMAIL, dto.email)

      // 验证 OTP
      const otp = await this.validateOtp(OTP_TYPES.EMAIL, dto.email, dto.otp, OTP_USAGES.LOGIN)

      if (!otp) {
        throw new UnauthorizedException('Invalid OTP')
      }

      // 标记 OTP 为已使用
      await this.otpRepository.markUsed(otp.getProps().id)

      return this.createAuthResult(loginMethod, {
        otpId: otp.getProps().id,
        otpType: OTP_TYPES.EMAIL
      })
    } catch (error) {
      return this.handleAuthError(error, 'OTP authentication failed')
    }
  }

  override validateInput(dto: EmailOtpLoginDto): boolean {
    return (
      super.validateInput(dto) &&
      typeof dto.email === 'string' &&
      typeof dto.otp === 'string' &&
      dto.email.length > 0 &&
      dto.otp.length === 6
    )
  }

  /**
   * 验证 OTP
   * @param type OTP 类型
   * @param identifier 标识符（邮箱或手机号）
   * @param code 验证码
   * @param usage 用途
   * @returns OneTimeToken 或 null
   */
  private async validateOtp(
    type: OTP_TYPES,
    identifier: string,
    code: string,
    usage: OTP_USAGES
  ): Promise<OneTimeToken | null> {
    // 查找有效的 OTP
    const otps = await this.otpRepository.findAll()
    const validOtp = otps.find(
      (otp) =>
        otp.getProps().type === type &&
        otp.getProps().identifier === identifier &&
        otp.getProps().usage === usage &&
        otp.isValid() &&
        !otp.isConsumed() &&
        !otp.isExpired()
    )

    if (!validOtp) {
      return null
    }

    // 验证验证码
    if (!validOtp.verify(code)) {
      // 记录失败尝试
      validOtp.recordFailAttempt()
      await this.otpRepository.save(validOtp)
      return null
    }

    return validOtp
  }
}

@Injectable()
export class PhoneOtpProvider extends BaseAuthProvider<PhoneOtpLoginDto> {
  constructor(
    loginMethodRepository: any,
    private readonly otpRepository: IOtpRepository
  ) {
    super(loginMethodRepository, LoginMethodEnum.PhoneOtp)
  }

  async authenticate(dto: PhoneOtpLoginDto): Promise<AuthResult> {
    // 验证输入参数
    if (!this.validateInput(dto) || !dto.phone || !dto.otp) {
      throw new BadRequestException('Phone and OTP are required')
    }

    try {
      // 查找并验证登录方法
      const loginMethod = await this.findAndValidateLoginMethod(LOGIN_METHOD_TYPES.PHONE, dto.phone)

      // 验证 OTP
      const otp = await this.validateOtp(OTP_TYPES.PHONE, dto.phone, dto.otp, OTP_USAGES.LOGIN)

      if (!otp) {
        throw new UnauthorizedException('Invalid OTP')
      }

      // 标记 OTP 为已使用
      await this.otpRepository.markUsed(otp.getProps().id)

      return this.createAuthResult(loginMethod, {
        otpId: otp.getProps().id,
        otpType: OTP_TYPES.PHONE
      })
    } catch (error) {
      return this.handleAuthError(error, 'OTP authentication failed')
    }
  }

  override validateInput(dto: PhoneOtpLoginDto): boolean {
    return (
      super.validateInput(dto) &&
      typeof dto.phone === 'string' &&
      typeof dto.otp === 'string' &&
      dto.phone.length > 0 &&
      dto.otp.length === 6
    )
  }

  /**
   * 验证 OTP
   * @param type OTP 类型
   * @param identifier 标识符（邮箱或手机号）
   * @param code 验证码
   * @param usage 用途
   * @returns OneTimeToken 或 null
   */
  private async validateOtp(
    type: OTP_TYPES,
    identifier: string,
    code: string,
    usage: OTP_USAGES
  ): Promise<OneTimeToken | null> {
    // 查找有效的 OTP
    const otps = await this.otpRepository.findAll()
    const validOtp = otps.find(
      (otp) =>
        otp.getProps().type === type &&
        otp.getProps().identifier === identifier &&
        otp.getProps().usage === usage &&
        otp.isValid() &&
        !otp.isConsumed() &&
        !otp.isExpired()
    )

    if (!validOtp) {
      return null
    }

    // 验证验证码
    if (!validOtp.verify(code)) {
      // 记录失败尝试
      validOtp.recordFailAttempt()
      await this.otpRepository.save(validOtp)
      return null
    }

    return validOtp
  }
}
