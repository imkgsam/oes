import { ListAccountWorkEmailAssetsHandler } from './list-account-work-email-assets.handler'
import { ListAccountWorkPhoneAssetsHandler } from './list-account-work-phone-assets.handler'

export * from './list-account-work-email-assets.query'
export * from './list-account-work-phone-assets.query'
export * from './contact-query.result'

export const ContactQueryHandlers = [
  ListAccountWorkEmailAssetsHandler,
  ListAccountWorkPhoneAssetsHandler
]
