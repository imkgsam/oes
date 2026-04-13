import { BadRequestException } from '@nestjs/common'
import { LoginMethodDto } from '../../interfaces/http/dtos/login.dto'

// Maps auth-bff HTTP login method enums to the downstream auth-service enum strings.
export function toAuthServiceLoginMethod(loginMethod: LoginMethodDto): string {
  switch (loginMethod) {
    case LoginMethodDto.EMAIL_PASSWORD:
      return 'email-password'
    case LoginMethodDto.EMAIL_OTP:
      return 'email-otp'
    case LoginMethodDto.PHONE_PASSWORD:
      return 'phone-password'
    case LoginMethodDto.PHONE_OTP:
      return 'phone-otp'
    default:
      throw new BadRequestException('Unsupported login method')
  }
}
