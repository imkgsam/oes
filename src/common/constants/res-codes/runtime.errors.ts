import { RawException } from "../../interfaces/exceptions.interface";

export const GLOBAL_RUNTIME_ERRORS: Record<string, RawException> = {
  UNKNOWN_ERROR: {
    subCode: '9999',
    message: '未知系统错误',
    messageKey: 'runtime.unknown_error',
    httpStatus: 500,
  },
  INVALID_RPC_STRUCTURE: {
    subCode: '0002',
    message: '无效的 RPC 响应结构',
    messageKey: 'runtime.invalid_rpc_structure',
    httpStatus: 500,
  },
}