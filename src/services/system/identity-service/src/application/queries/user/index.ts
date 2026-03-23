import { GetUserByIdHandler } from './get-user-by-id.handler'
import { GetUserByEmailHandler } from './get-user-by-email.handler'
import { GetUserByPhoneHandler } from './get-user-by-phone.handler'

export * from './get-user-by-id.query'
export * from './get-user-by-email.query'
export * from './get-user-by-phone.query'

export const UserQueryHandlers = [
  GetUserByIdHandler,
  GetUserByEmailHandler,
  GetUserByPhoneHandler
]
