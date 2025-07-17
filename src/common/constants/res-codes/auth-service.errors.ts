import { RawException } from '../../interfaces/exceptions.interface'

export const AUTH_SERVICE_ERRORS: Record<string, RawException> = {
  NOT_ALLOW_LOGIN: {
    subCode: '0001',
    message: 'Not allowed to login',
    messageKey: 'auth.not_allow_login',
    httpStatus: 333,
  }
}
