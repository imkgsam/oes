import { ExceptionConst } from '../../../core/interfaces/exceptions.interface'

// RPC 相关错误
// 3xxx

export const RPC_EXCEPTIONS: Record<string, ExceptionConst> = {
  INVALID_RPC_STRUCTURE: {
    subCode: '3001',
    message: '无效的 RPC 响应结构',
    messageKey: 'runtime.invalid_rpc_structure',
    httpStatus: 500
  },
  RPC_CONNECTION_FAILED: {
    subCode: '3007',
    message: 'RPC 服务连接失败',
    messageKey: 'system.rpc_connection_failed',
    httpStatus: 503
  },
  RPC_TIMEOUT: {
    subCode: '3008',
    message: 'RPC 请求超时',
    messageKey: 'system.rpc_timeout',
    httpStatus: 504
  },
  RPC_RESPONSE_INVALID: {
    subCode: '3009',
    message: 'RPC 响应格式错误',
    messageKey: 'system.rpc_response_invalid',
    httpStatus: 502
  }
}
