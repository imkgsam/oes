import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_CONTACT_ASSET_NOT_FOUND',
  message: 'Account contact asset not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.account.contact.asset.not.found'
}

export const IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'IDENTITY_WORK_EMAIL_ALREADY_ASSIGNED',
  message: 'Work email is already assigned',
  rpcStatus: status.ALREADY_EXISTS,
  messageKey: 'identity.work.email.already.assigned'
}

export const IDENTITY_INVALID_WORK_EMAIL: ExceptionDefinition = {
  code: 'IDENTITY_INVALID_WORK_EMAIL',
  message: 'Work email is invalid',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.work.email.invalid'
}

export const IDENTITY_WORK_PHONE_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'IDENTITY_WORK_PHONE_ALREADY_ASSIGNED',
  message: 'Work phone is already assigned',
  rpcStatus: status.ALREADY_EXISTS,
  messageKey: 'identity.work.phone.already.assigned'
}

export const IDENTITY_INVALID_WORK_PHONE: ExceptionDefinition = {
  code: 'IDENTITY_INVALID_WORK_PHONE',
  message: 'Work phone is invalid',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.work.phone.invalid'
}

export const IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED: ExceptionDefinition = {
  code: 'IDENTITY_REVOKED_CONTACT_ASSET_CANNOT_BE_MODIFIED',
  message: 'Revoked contact asset cannot be modified',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.contact.asset.revoked.cannot.be.modified'
}

export const IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY: ExceptionDefinition = {
  code: 'IDENTITY_DISABLED_CONTACT_ASSET_CANNOT_BE_PRIMARY',
  message: 'Disabled contact asset cannot be primary',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.contact.asset.disabled.cannot.be.primary'
}
