import { Permission } from '../../domain/aggregates/permission.aggregate'
import { PermissionKind } from '../../domain/enums/permission-kind.enum'
import { ScopeLevel } from '../../domain/enums/scope-level.enum'

/** PermissionMapper preserves persisted permission metadata at the domain repository boundary. */
export class PermissionMapper {
  static toDomain(input: any) {
    return new Permission(
      input.id,
      input.code,
      input.module,
      input.description,
      input.kind as PermissionKind,
      input.externalApiEligible,
      normalizePersistedScopeLevels(input.allowedScopeLevels),
      typeof input.definitionFingerprint === 'string' ? input.definitionFingerprint : ''
    )
  }
  static toPersistant(input: Permission) {
    return {
      id: input.id,
      code: input.code,
      module: input.module,
      description: input.description,
      kind: input.kind,
      externalApiEligible: input.externalApiEligible,
      allowedScopeLevels: [...input.allowedScopeLevels],
      definitionFingerprint: input.definitionFingerprint
    }
  }
}

/** normalizePersistedScopeLevels preserves only canonical values so malformed rows fail closed. */
function normalizePersistedScopeLevels(value: unknown): ScopeLevel[] {
  if (!Array.isArray(value) || value.length === 0) return []
  if (value.some((scope) => scope !== ScopeLevel.SYSTEM && scope !== ScopeLevel.TENANT)) return []
  if (new Set(value).size !== value.length) return []
  return [...value] as ScopeLevel[]
}
