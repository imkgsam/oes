import {
  normalizeTerminalAccessList,
  normalizeTerminalAccessTerminal,
  TerminalAccessTerminal
} from '../constants/terminal-access-terminal'

export type TerminalAccessReasonCode = 'ALLOWED' | 'TERMINAL_ACCESS_DENIED' | 'INVALID_TERMINAL'

export type TerminalAccessResolutionSource = 'ACCOUNT_OVERRIDE' | 'ROLE_UNION'

export interface RoleTerminalAccessFact {
  roleId: string
  allowedTerminals: readonly string[]
}

export interface AccountTerminalAccessOverrideFact {
  accountId: string
  allowedTerminals: readonly string[]
}

export interface TerminalAccessResolveInput {
  terminal: string
  activeRoleIds: readonly string[]
  roleTerminalAccess: readonly RoleTerminalAccessFact[]
  accountOverride?: AccountTerminalAccessOverrideFact | null
}

export interface TerminalAccessResolution {
  allowed: boolean
  reasonCode: TerminalAccessReasonCode
  effectiveAllowedTerminals: TerminalAccessTerminal[]
  resolutionSource: TerminalAccessResolutionSource
  matchedRoleIds: string[]
}

/** TerminalAccessResolverService applies account override replacement and role-union fallback for login terminal access. */
export class TerminalAccessResolverService {
  resolve(input: TerminalAccessResolveInput): TerminalAccessResolution {
    const resolutionSource: TerminalAccessResolutionSource = input.accountOverride
      ? 'ACCOUNT_OVERRIDE'
      : 'ROLE_UNION'
    const requestedTerminal = normalizeTerminalAccessTerminal(input.terminal)

    if (!requestedTerminal) {
      return {
        allowed: false,
        reasonCode: 'INVALID_TERMINAL',
        effectiveAllowedTerminals: [],
        resolutionSource,
        matchedRoleIds: resolutionSource === 'ROLE_UNION' ? [...input.activeRoleIds] : []
      }
    }

    const effectiveAllowedTerminals =
      resolutionSource === 'ACCOUNT_OVERRIDE'
        ? normalizeTerminalAccessList(input.accountOverride?.allowedTerminals ?? [])
        : this.resolveRoleUnion(input.activeRoleIds, input.roleTerminalAccess)
    const allowed = effectiveAllowedTerminals.includes(requestedTerminal)

    return {
      allowed,
      reasonCode: allowed ? 'ALLOWED' : 'TERMINAL_ACCESS_DENIED',
      effectiveAllowedTerminals,
      resolutionSource,
      matchedRoleIds: resolutionSource === 'ROLE_UNION' ? [...input.activeRoleIds] : []
    }
  }

  private resolveRoleUnion(
    activeRoleIds: readonly string[],
    roleTerminalAccess: readonly RoleTerminalAccessFact[]
  ): TerminalAccessTerminal[] {
    const activeRoleIdSet = new Set(activeRoleIds)
    const terminals = roleTerminalAccess
      .filter((fact) => activeRoleIdSet.has(fact.roleId))
      .flatMap((fact) => fact.allowedTerminals)

    return normalizeTerminalAccessList(terminals)
  }
}
