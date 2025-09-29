// File: src/common/interfaces/services/auth-service/rpc.contract.ts
import {
  EmailOtpLoginRequestDto,
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  LoginResponseDto,
  PhoneOtpLoginRequestDto,
  PhonePasswordLoginRequestDto,
  WechatLoginRequestDto
} from '../../../dtos/auth-service/all.dto'

// RPC 测试接口
export interface IAuthServiceRpcTestContract {
  testing(): Promise<any>
}

// PRC AUTH 接口
export interface IAuthServiceRpcAuthContract {
  loginWithEmailPassword(data: EmailPasswordLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhonePassword(data: PhonePasswordLoginRequestDto): Promise<LoginResponseDto>
  loginWithEmailOtp(data: EmailOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhoneOtp(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithGoogle(data: GoogleLoginRequestDto): Promise<LoginResponseDto>
  loginWithWechat(data: WechatLoginRequestDto): Promise<LoginResponseDto>
}

// PRC ADMIN 接口
export interface IAuthServiceRpcAdminContract {}

// RPC 接口
export interface IAuthServiceRpcContract extends IAuthServiceRpcTestContract {}
