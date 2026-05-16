import { applyDecorators, SetMetadata } from '@nestjs/common'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '../constants'
import { RequireAuthenticatedOperator } from './require-authenticated-operator.decorator'

export type RequirePermissionsMetadata =
  | {
      all: string[]
      any?: never
    }
  | {
      any: string[]
      all?: never
    }

// Declares coarse-grained permission codes required before an interface handler may execute.
export const RequirePermissions = (metadata: RequirePermissionsMetadata) =>
  applyDecorators(
    RequireAuthenticatedOperator(),
    SetMetadata(REQUIRE_PERMISSIONS_METADATA_KEY, normalizeRequirePermissionsMetadata(metadata))
  )

// Normalizes permission metadata and fails fast when a handler declares an invalid permission mode.
function normalizeRequirePermissionsMetadata(
  metadata: RequirePermissionsMetadata
): RequirePermissionsMetadata {
  const hasAll = Object.prototype.hasOwnProperty.call(metadata, 'all')
  const hasAny = Object.prototype.hasOwnProperty.call(metadata, 'any')

  if (hasAll && hasAny) {
    throw new Error('RequirePermissions cannot declare both all and any permissions')
  }

  if (!hasAll && !hasAny) {
    throw new Error('RequirePermissions must declare either all or any permissions')
  }

  const mode = hasAll ? 'all' : 'any'
  const permissions = metadata[mode]

  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new Error(`RequirePermissions ${mode} permissions must be a non-empty array`)
  }

  const normalized = permissions.map((permission) => {
    if (typeof permission !== 'string' || permission.trim().length === 0) {
      throw new Error('RequirePermissions permission codes must be non-empty strings')
    }
    return permission.trim()
  })

  return mode === 'all' ? { all: normalized } : { any: normalized }
}
