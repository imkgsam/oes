import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { Permission } from '../aggregates/permission.aggregate'
import { PermissionDecisionCatalogEntry } from '../authorization/permission-decision.types'

/** PermissionCatalogMetadataError marks a known or granted Code whose runtime row is absent or stale. */
export class PermissionCatalogMetadataError extends Error {
  constructor(code: string) {
    super(`PERMISSION_CATALOG_METADATA_STALE:${code}`)
    this.name = 'PermissionCatalogMetadataError'
  }
}

/** PermissionCatalogEligibilityError marks a current Code that is invalid for the requested boundary. */
export class PermissionCatalogEligibilityError extends Error {
  constructor(code: string) {
    super(`PERMISSION_CATALOG_INELIGIBLE:${code}`)
    this.name = 'PermissionCatalogEligibilityError'
  }
}

/** Builds fail-closed decision metadata by binding one runtime row to its exact Common definition. */
export function toPermissionDecisionCatalogEntry(
  permission: Permission
): PermissionDecisionCatalogEntry {
  const definition = getPermissionCodeDefinition(permission.code)
  const metadataCurrent = Boolean(
    definition &&
    permission.definitionFingerprint === permissionDefinitionFingerprint(definition) &&
    permission.kind === definition.kind &&
    permission.externalApiEligible === (definition.externalApiEligible === true) &&
    permission.allowedScopeLevels.length === definition.allowedScopeLevels.length &&
    permission.allowedScopeLevels.every(
      (scope, index) => scope === definition.allowedScopeLevels[index]
    )
  )

  return {
    code: permission.code,
    kind: permission.kind,
    allowedScopeLevels: [...permission.allowedScopeLevels],
    assignableTo: definition ? [...definition.assignableTo] : [],
    metadataCurrent
  }
}

/** Checks current kind, scope and assignee metadata for one exact decision boundary. */
export function matchesPermissionDecisionEligibility(
  entry: PermissionDecisionCatalogEntry,
  requirement: {
    kind: PermissionDecisionCatalogEntry['kind']
    scopeLevel: PermissionDecisionCatalogEntry['allowedScopeLevels'][number]
    assignee: PermissionDecisionCatalogEntry['assignableTo'][number]
  }
): boolean {
  return (
    entry.metadataCurrent &&
    entry.kind === requirement.kind &&
    entry.allowedScopeLevels.includes(requirement.scopeLevel) &&
    entry.assignableTo.includes(requirement.assignee)
  )
}
