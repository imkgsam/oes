import {
  EmailOtpLoginRequestDto,
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  PhoneOtpLoginRequestDto,
  WechatLoginRequestDto
} from '../../dtos/auth-service/api/rpc/all.dto'

// RPC 测试接口
export interface IAuthServiceRpcTestPort {
  testing(): Promise<any>
}

// PRC AUTH 接口
export interface IAuthServiceRpcAuthPort {}

// PRC ADMIN 接口
export interface IAuthServiceRpcAdminPort {}

// RPC 接口
export interface IAuthServiceRpcPort extends IAuthServiceRpcTestPort {}

// HTTP 接口
export interface IAuthServiceHttpPort {}

// 汇总服务接口
export interface IAuthServicePort extends IAuthServiceRpcPort, IAuthServiceHttpPort {}
