import { BindAccountAvatarHandler } from './bind-account-avatar.handler'
import { UploadAccountAvatarHandler } from './upload-account-avatar.handler'

export * from './bind-account-avatar.command'
export * from './bind-account-avatar.handler'
export * from './upload-account-avatar.command'
export * from './upload-account-avatar.handler'

export const AvatarCommandHandlers = [UploadAccountAvatarHandler, BindAccountAvatarHandler]
