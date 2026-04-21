import { NavigationEntry } from '../../domain/aggregates/navigation-entry.aggregate'
import { RoleLandingPolicy } from '../../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../../domain/vo/role-navigation-visibility.value-object'

type NavigationEntryRecord = {
  entryKey: string
  name: string
  description: string | null
  featureKey: string | null
  supportedTerminals: unknown
  registryPriority: number
  enabled: boolean
  entryType: string
}

type RoleNavigationVisibilityRecord = {
  roleId: string
  entryKey: string
  terminal: string
  enabled: boolean
}

type RoleLandingPolicyRecord = {
  roleId: string
  terminal: string
  defaultEntryKey: string
  priority: number
  enabled: boolean
}

/** NavigationMapper converts Prisma records into navigation governance domain objects. */
export class NavigationMapper {
  static toEntryDomain(record: NavigationEntryRecord): NavigationEntry {
    return new NavigationEntry(
      record.entryKey,
      record.name,
      record.description,
      record.featureKey,
      Array.isArray(record.supportedTerminals)
        ? record.supportedTerminals.filter((terminal): terminal is string => typeof terminal === 'string')
        : [],
      record.registryPriority,
      record.enabled,
      record.entryType
    )
  }

  static toVisibilityDomain(record: RoleNavigationVisibilityRecord): RoleNavigationVisibility {
    return new RoleNavigationVisibility(record.roleId, record.entryKey, record.terminal, record.enabled)
  }

  static toLandingPolicyDomain(record: RoleLandingPolicyRecord): RoleLandingPolicy {
    return new RoleLandingPolicy(
      record.roleId,
      record.terminal,
      record.defaultEntryKey,
      record.priority,
      record.enabled
    )
  }
}
