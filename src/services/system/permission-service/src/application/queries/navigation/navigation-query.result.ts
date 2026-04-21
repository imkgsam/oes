import { NavigationEntry } from '../../../domain/aggregates/navigation-entry.aggregate'
import { RoleLandingPolicy } from '../../../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../../../domain/vo/role-navigation-visibility.value-object'

export interface NavigationEntryPageResult {
  entries: NavigationEntry[]
  total: number
  page: number
  pageSize: number
}

export interface RoleNavigationQueryResult {
  roleId: string
  visibility: RoleNavigationVisibility[]
  landingPolicies: RoleLandingPolicy[]
}

export interface NavigationPreviewResult {
  visibleEntries: string[]
  defaultEntry: string
  resolvedByRoleId?: string
  fallbackReason?: string
}
