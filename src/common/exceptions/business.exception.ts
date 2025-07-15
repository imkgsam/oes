import { BaseException } from './base.exception'
import { ExceptionObject } from '../interfaces/exception-object.interface'

export class BusinessException extends BaseException {
  constructor(excep: ExceptionObject) {
    super(
      `${excep.prefixCode}${excep.code}`,
      excep.message,
      excep.messageKey,
      excep.httpStatus,
      excep.module,
    )
  }
}
