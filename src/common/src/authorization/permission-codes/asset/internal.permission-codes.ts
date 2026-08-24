import type { PermissionDefinitionGroup } from '../types'

export const ASSET_INTERNAL_PERMISSION_CODES = {
  AVATAR_RESOLVE_PUBLIC_URL: 'asset.internal.avatar.resolve_public_url'
} as const

export const ASSET_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'asset-service',
  permissions: {
    [ASSET_INTERNAL_PERMISSION_CODES.AVATAR_RESOLVE_PUBLIC_URL]: {
      description: '解析受控头像公开展示地址',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
