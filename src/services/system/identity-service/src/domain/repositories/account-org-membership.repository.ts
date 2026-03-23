import { AccountOrgMembershipEntity } from '../entities/account-org-membership.entity'

export interface AccountOrgMembershipRepository {
  clearPrimaryByAccountId(accountId: string): Promise<void>
  findByAccountAndOrg(accountId: string, orgId: string): Promise<AccountOrgMembershipEntity | null>
  listByAccountId(accountId: string): Promise<AccountOrgMembershipEntity[]>
  addSecondaryMembership(accountId: string, orgId: string): Promise<AccountOrgMembershipEntity>
  removeMembership(accountId: string, orgId: string): Promise<AccountOrgMembershipEntity | null>
  setPrimaryOrg(accountId: string, orgId: string): Promise<AccountOrgMembershipEntity>
}
