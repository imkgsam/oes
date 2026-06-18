import { ListAccountContactAssetsHandler } from './list-account-contact-assets.handler'
import { ListAccountWorkEmailAssetsHandler } from './list-account-work-email-assets.handler'
import { ListAccountWorkPhoneAssetsHandler } from './list-account-work-phone-assets.handler'
import { ResolveContactActionTargetsHandler } from './resolve-contact-action-targets.handler'

export * from './list-account-contact-assets.query'
export * from './list-account-work-email-assets.query'
export * from './list-account-work-phone-assets.query'
export * from './resolve-contact-action-targets.query'
export * from './contact-query.result'

export const ContactQueryHandlers = [
  ListAccountContactAssetsHandler,
  ListAccountWorkEmailAssetsHandler,
  ListAccountWorkPhoneAssetsHandler,
  ResolveContactActionTargetsHandler
]
