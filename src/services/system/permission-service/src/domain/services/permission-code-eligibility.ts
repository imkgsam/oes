import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { Permission } from '../aggregates/permission.aggregate'
import { PermissionDecisionCatalogEntry } from '../authorization/permission-decision.types'

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
