import type { PermissionDefinitionGroup } from '../types'

export const IDENTITY_MACHINE_PERMISSION_CODES = {
  CREATE_SERVICE_ACCOUNT: 'identity.machine.service_account.create',
  UPDATE_SERVICE_ACCOUNT_STATUS: 'identity.machine.service_account.update_status',
  CREATE_API_KEY: 'identity.machine.api_key.create',
  REVOKE_API_KEY: 'identity.machine.api_key.revoke',
  ROTATE_API_KEY: 'identity.machine.api_key.rotate',
  MANAGE_WORKLOAD_BINDING: 'identity.machine.workload_binding.manage'
} as const

export const IDENTITY_MACHINE_PERMISSION_DEFINITIONS = {
  ownerService: 'identity-service',
  permissions: {
    [IDENTITY_MACHINE_PERMISSION_CODES.CREATE_SERVICE_ACCOUNT]: {
      description: '创建服务账号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_MACHINE_PERMISSION_CODES.UPDATE_SERVICE_ACCOUNT_STATUS]: {
      description: '更新服务账号状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_MACHINE_PERMISSION_CODES.CREATE_API_KEY]: {
      description: '创建 API Key',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_MACHINE_PERMISSION_CODES.REVOKE_API_KEY]: {
      description: '撤销 API Key',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_MACHINE_PERMISSION_CODES.ROTATE_API_KEY]: {
      description: '轮换 API Key',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_MACHINE_PERMISSION_CODES.MANAGE_WORKLOAD_BINDING]: {
      description: '管理第一方机器工作负载绑定',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
