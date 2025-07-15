import { RawException } from '../interfaces/exceptions.interface'
import { BaseException } from './base.exception'

export class SystemException extends BaseException {
  constructor(raw: RawException, details?: any) {
    super(
      `${raw.prefixCode}${raw.code}`,
      raw.message,
      raw.messageKey,
      raw.httpStatus,
      raw.module,
      details,
    )
  }
}
