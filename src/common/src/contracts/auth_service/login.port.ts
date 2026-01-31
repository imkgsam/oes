// File: src/common/contracts/auth-service/login.port.ts
import {
  EmailOtpLoginRequestDto,
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  LoginResponseDto,
  PhoneOtpLoginRequestDto,
  PhonePasswordLoginRequestDto,
  WechatLoginRequestDto
} from '../../dtos/auth-service/all.dto'

// RPC AUTH 接口
export interface LoginPort {
  loginWithEmailPassword(data: EmailPasswordLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhonePassword(data: PhonePasswordLoginRequestDto): Promise<LoginResponseDto>
  loginWithEmailOtp(data: EmailOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhoneOtp(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithGoogle(data: GoogleLoginRequestDto): Promise<LoginResponseDto>
  loginWithWechat(data: WechatLoginRequestDto): Promise<LoginResponseDto>
}
