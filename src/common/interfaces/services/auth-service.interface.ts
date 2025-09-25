import {
  EmailOtpLoginRequestDto,
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  LoginResponseDto,
  PhoneOtpLoginRequestDto,
  WechatLoginRequestDto
} from '../../dtos/auth-service/api/rpc/all.dto'

// RPC 测试接口
export interface IAuthServiceRpcTestPort {
  testing(): Promise<any>
}

// PRC AUTH 接口
export interface IAuthServiceRpcAuthPort {
  loginWithEmailPassword(data: EmailPasswordLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhonePassword(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithEmailOtp(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithPhoneOtp(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithGoogle(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
  loginWithWechat(data: PhoneOtpLoginRequestDto): Promise<LoginResponseDto>
}

// PRC ADMIN 接口
export interface IAuthServiceRpcAdminPort {}

// RPC 接口
export interface IAuthServiceRpcPort extends IAuthServiceRpcTestPort {}

// HTTP 接口
export interface IAuthServiceHttpPort {}

// 汇总服务接口
export interface IAuthServicePort extends IAuthServiceRpcPort, IAuthServiceHttpPort {}
