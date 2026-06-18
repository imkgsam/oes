import { BindAccountAvatarHandler } from './bind-account-avatar.handler'
import { BindEmployeeOfficialPhotoHandler } from './bind-employee-official-photo.handler'
import { UploadAccountAvatarHandler } from './upload-account-avatar.handler'
import { UploadEmployeeOfficialPhotoHandler } from './upload-employee-official-photo.handler'

export * from './bind-account-avatar.command'
export * from './bind-account-avatar.handler'
export * from './bind-employee-official-photo.command'
export * from './bind-employee-official-photo.handler'
export * from './upload-account-avatar.command'
export * from './upload-account-avatar.handler'
export * from './upload-employee-official-photo.command'
export * from './upload-employee-official-photo.handler'

export const AvatarCommandHandlers = [
  UploadAccountAvatarHandler,
  BindAccountAvatarHandler,
  UploadEmployeeOfficialPhotoHandler,
  BindEmployeeOfficialPhotoHandler
]
