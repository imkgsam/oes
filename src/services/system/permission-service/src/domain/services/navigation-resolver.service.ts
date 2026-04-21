import { NavigationEntry } from '../aggregates/navigation-entry.aggregate'
import { DEFAULT_NAVIGATION_TERMINAL } from '../constants/navigation-terminal'
import { RoleLandingPolicy } from '../vo/role-landing-policy.value-object'

export interface NavigationResolution {
  visibleEntries: string[]
  defaultEntry: string
  resolvedByRoleId?: string
  fallbackReason?: string
}

/** NavigationResolverService selects visible entries and a default entry from governance facts. */
export class NavigationResolverService {
  resolve(input: {
    visibleEntries: NavigationEntry[]
    landingPolicies: RoleLandingPolicy[]
    scopeLevel: string
    terminal?: string
  }): NavigationResolution {
    const terminal = input.terminal?.trim() || DEFAULT_NAVIGATION_TERMINAL
    const visibleEntryKeys = input.visibleEntries.map((entry) => entry.entryKey)
    const visibleSet = new Set(visibleEntryKeys)
    const landingCandidate = [...input.landingPolicies]
      .sort((left, right) => {
        const terminalDiff =
          terminalSpecificity(right, terminal) - terminalSpecificity(left, terminal)
        if (terminalDiff !== 0) return terminalDiff
        if (right.priority !== left.priority) return right.priority - left.priority
        if (left.roleId !== right.roleId) return left.roleId.localeCompare(right.roleId)
        return left.defaultEntryKey.localeCompare(right.defaultEntryKey)
      })
      .find((policy) => policy.enabled && visibleSet.has(policy.defaultEntryKey))

    if (landingCandidate) {
      return {
        visibleEntries: visibleEntryKeys,
        defaultEntry: landingCandidate.defaultEntryKey,
        resolvedByRoleId: landingCandidate.roleId
      }
    }

    const registryCandidate = [...input.visibleEntries].sort((left, right) => {
      if (right.registryPriority !== left.registryPriority) {
        return right.registryPriority - left.registryPriority
      }
      return left.entryKey.localeCompare(right.entryKey)
    })[0]

    if (registryCandidate) {
      return {
        visibleEntries: visibleEntryKeys,
        defaultEntry: registryCandidate.entryKey,
        fallbackReason: 'REGISTRY_PRIORITY'
      }
    }

    return {
      visibleEntries: visibleEntryKeys,
      defaultEntry: '',
      fallbackReason: 'NO_VISIBLE_ENTRIES'
    }
  }
}

/** terminalSpecificity ranks exact terminal overrides ahead of DEFAULT landing rules. */
function terminalSpecificity(policy: RoleLandingPolicy, terminal: string): number {
  if (policy.terminal === terminal) return 2
  if (policy.terminal === DEFAULT_NAVIGATION_TERMINAL) return 1
  return 0
}
