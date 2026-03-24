import { ListAccountWorkEmailAssetsHandler } from './list-account-work-email-assets.handler'
import { ListAccountWorkPhoneAssetsHandler } from './list-account-work-phone-assets.handler'

export * from './list-account-work-email-assets.query'
export * from './list-account-work-phone-assets.query'

export const ContactQueryHandlers = [
  ListAccountWorkEmailAssetsHandler,
  ListAccountWorkPhoneAssetsHandler
]
