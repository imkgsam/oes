import { NavigationEntry } from '../aggregates/navigation-entry.aggregate'
import { RoleLandingPolicy } from '../vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../vo/role-navigation-visibility.value-object'

export interface NavigationEntryPageQuery {
  page: number
  pageSize: number
  keyword?: string
  featureKey?: string
  terminal?: string
  enabled?: boolean
}

export interface PagedNavigationEntryResult {
  entries: NavigationEntry[]
  total: number
  page: number
  pageSize: number
}

export interface RoleNavigationConfig {
  roleId: string
  visibility: RoleNavigationVisibility[]
  landingPolicies: RoleLandingPolicy[]
}

/** NavigationRepository stores entry registry, role visibility, and role landing policy facts. */
export interface NavigationRepository {
  findEntryByKey(entryKey: string): Promise<NavigationEntry | null>
  listEntries(query: NavigationEntryPageQuery): Promise<PagedNavigationEntryResult>
  saveEntry(entry: NavigationEntry): Promise<NavigationEntry>
  findRoleNavigation(roleId: string): Promise<RoleNavigationConfig>
  replaceRoleVisibility(roleId: string, visibility: RoleNavigationVisibility[]): Promise<RoleNavigationConfig>
  replaceRoleLandingPolicies(roleId: string, policies: RoleLandingPolicy[]): Promise<RoleNavigationConfig>
  findVisibleEntriesForRoles(input: {
    roleIds: string[]
    terminal: string
  }): Promise<NavigationEntry[]>
  findLandingPoliciesForRoles(input: {
    roleIds: string[]
    terminal: string
  }): Promise<RoleLandingPolicy[]>
}
