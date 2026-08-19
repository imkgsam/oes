import type { PermissionDefinitionGroup } from '../types'

export const MES_MANAGEMENT_PERMISSION_CODES = {
  READ_PRODUCTION_SPEC: 'mes.production_spec.read',
  MANAGE_PRODUCTION_SPEC: 'mes.production_spec.manage',
  READ_MOLD_DESIGN: 'mes.mold_design.read',
  MANAGE_MOLD_DESIGN: 'mes.mold_design.manage',
  READ_PRODUCTION_MOLD: 'mes.production_mold.read',
  MANAGE_PRODUCTION_MOLD: 'mes.production_mold.manage',
  READ_TOOLING_INSTALLATION: 'mes.tooling_installation.read',
  MANAGE_TOOLING_INSTALLATION: 'mes.tooling_installation.manage',
  RECORD_MOLD_USAGE: 'mes.mold_usage.record',
  MANAGE_MOLD_LIFE: 'mes.mold_life.manage'
} as const

export const MES_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'mes-service',
  permissions: {
    [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_SPEC]: {
      description: '查看 MES 生产规格目录、详情与模具适配解析',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_SPEC]: {
      description: '创建、更新、启用与退役 MES 生产规格',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN]: {
      description: '查看模具设计目录与详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN]: {
      description: '登记和维护模具设计',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD]: {
      description: '查看生产模具、当前位置、安装、寿命与预警摘要',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD]: {
      description: '登记、转移、安装、卸下、报废生产模具',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.READ_TOOLING_INSTALLATION]: {
      description: '查看工装安装、当前位置、安装历史与日模具清单',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_TOOLING_INSTALLATION]: {
      description: '维护工装安装、卸下、移动与安装位置',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE]: {
      description: '记录产线当日模具注浆或其他模具使用事实',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_LIFE]: {
      description: '调整模具寿命计数并确认寿命预警',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
