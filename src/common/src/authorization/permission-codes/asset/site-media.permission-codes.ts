import type { PermissionDefinitionGroup } from '../types'

export const ASSET_SITE_MEDIA_PERMISSION_CODES = {
  UPLOAD: 'asset.site_media.upload',
  READ: 'asset.site_media.read',
  DELIVERY_MANAGE: 'asset.site_media.delivery.manage',
  ARCHIVE: 'asset.site_media.archive',
  TAKEDOWN: 'asset.site_media.takedown',
  DELETE: 'asset.site_media.delete',
  RESOLVE: 'asset.internal.site_media.resolve',
  PUBLICATION_PROTECT: 'asset.internal.site_media.publication.protect',
  PUBLICATION_RELEASE: 'asset.internal.site_media.publication.release'
} as const

export const ASSET_SITE_MEDIA_PERMISSION_DEFINITIONS = {
  ownerService: 'asset-service',
  permissions: {
    [ASSET_SITE_MEDIA_PERMISSION_CODES.UPLOAD]: {
      description: '上传受控 Site Media',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.READ]: {
      description: '读取受控 Site Media',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.DELIVERY_MANAGE]: {
      description: '管理 Site Media 交付绑定',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.ARCHIVE]: {
      description: '归档 Site Media',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.TAKEDOWN]: {
      description: '下架 Site Media',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.DELETE]: {
      description: '删除 Site Media',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.RESOLVE]: {
      description: '解析 Site 发布媒体',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.PUBLICATION_PROTECT]: {
      description: '保护 Site 发布媒体引用',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [ASSET_SITE_MEDIA_PERMISSION_CODES.PUBLICATION_RELEASE]: {
      description: '释放 Site 发布媒体引用保护',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
