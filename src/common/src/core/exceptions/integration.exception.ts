import { OESException } from './oes.exception'

export class IntegrationException extends OESException {
  constructor(
    code: string,
    message: string,
    messageKey: string,
    httpStatus: number,
    details?: any
  ) {
    super(code, message, messageKey, httpStatus, details)
  }
}
