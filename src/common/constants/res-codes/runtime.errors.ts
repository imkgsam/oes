import { RawException } from "../../interfaces/exceptions.interface";

export const GLOBAL_RUNTIME_ERRORS: Record<string, RawException> = {
  UNKNOWN_ERROR: {
    subCode: '9999',
    message: '未知系统错误',
    messageKey: 'runtime.unknown_error',
    httpStatus: 500,
  }
}