import { AddAccountOrgMembershipHandler } from './add-account-org-membership.handler'
import { RemoveAccountOrgMembershipHandler } from './remove-account-org-membership.handler'
import { SetAccountPrimaryOrgHandler } from './set-account-primary-org.handler'

export * from './add-account-org-membership.command'
export * from './remove-account-org-membership.command'
export * from './set-account-primary-org.command'

export const OrgCommandHandlers = [
  AddAccountOrgMembershipHandler,
  RemoveAccountOrgMembershipHandler,
  SetAccountPrimaryOrgHandler
]
