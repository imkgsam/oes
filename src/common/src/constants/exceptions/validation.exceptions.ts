import { ExceptionConst } from '../../core/interfaces/exceptions.interface'

export const VALIDATION_EXCEPTIONS: Record<string, ExceptionConst> = {
  VALIDATION_ERROR: {
    subCode: '9999',
    message: '数据验证失败',
    messageKey: 'runtime.validation_error',
    httpStatus: 400
  }
}
