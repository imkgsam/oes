import { CreateUserAccountHandler } from './create-user-account.handler'
import { DeleteAccountHandler } from './delete-account.handler'
import { SetAccountEnabledHandler } from './set-account-enabled.handler'
import { UpdateAccountProfileHandler } from './update-account-profile.handler'
import { UpdateUserBasicInfoHandler } from './update-user-basic-info.handler'

export * from './create-user-account.command'
export * from './create-user-account.handler'
export * from './delete-account.command'
export * from './delete-account.handler'
export * from './set-account-enabled.command'
export * from './set-account-enabled.handler'
export * from './update-account-profile.command'
export * from './update-account-profile.handler'
export * from './update-user-basic-info.command'
export * from './update-user-basic-info.handler'

export const AccountCommandHandlers = [
  CreateUserAccountHandler,
  DeleteAccountHandler,
  SetAccountEnabledHandler,
  UpdateAccountProfileHandler,
  UpdateUserBasicInfoHandler
]
