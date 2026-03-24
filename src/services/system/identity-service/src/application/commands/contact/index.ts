import { AssignAccountWorkEmailAssetHandler } from './assign-account-work-email-asset.handler'
import { AssignAccountWorkPhoneAssetHandler } from './assign-account-work-phone-asset.handler'
import { RevokeAccountWorkEmailAssetHandler } from './revoke-account-work-email-asset.handler'
import { RevokeAccountWorkPhoneAssetHandler } from './revoke-account-work-phone-asset.handler'
import { SetAccountPrimaryWorkEmailAssetHandler } from './set-account-primary-work-email-asset.handler'
import { SetAccountPrimaryWorkPhoneAssetHandler } from './set-account-primary-work-phone-asset.handler'
import { SetAccountWorkEmailAssetStatusHandler } from './set-account-work-email-asset-status.handler'
import { SetAccountWorkPhoneAssetStatusHandler } from './set-account-work-phone-asset-status.handler'

export * from './assign-account-work-email-asset.command'
export * from './assign-account-work-phone-asset.command'
export * from './revoke-account-work-email-asset.command'
export * from './revoke-account-work-phone-asset.command'
export * from './set-account-work-email-asset-status.command'
export * from './set-account-work-phone-asset-status.command'
export * from './set-account-primary-work-email-asset.command'
export * from './set-account-primary-work-phone-asset.command'

export const ContactCommandHandlers = [
  AssignAccountWorkEmailAssetHandler,
  AssignAccountWorkPhoneAssetHandler,
  RevokeAccountWorkEmailAssetHandler,
  RevokeAccountWorkPhoneAssetHandler,
  SetAccountWorkEmailAssetStatusHandler,
  SetAccountWorkPhoneAssetStatusHandler,
  SetAccountPrimaryWorkEmailAssetHandler,
  SetAccountPrimaryWorkPhoneAssetHandler
]
