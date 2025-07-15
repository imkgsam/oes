import { ExceptionObject } from '../interfaces/exception-object.interface'
import { BaseException } from './base.exception'

export class SystemException extends BaseException {
  constructor(excep: ExceptionObject, details?: any) {
    super(
      `${excep.prefixCode}${excep.code}`,
      excep.message,
      excep.messageKey,
      excep.httpStatus,
      excep.module,
      details,
    )
  }
}
