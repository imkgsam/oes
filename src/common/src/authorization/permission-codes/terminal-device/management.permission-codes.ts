import type { PermissionDefinitionGroup } from '../types'

export const TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES = {
  CREATE_ENROLLMENT: 'terminal-device.enrollment.create',
  REVOKE_ENROLLMENT: 'terminal-device.enrollment.revoke',
  READ_DEVICE: 'terminal-device.read',
  READ_SENSITIVE_DEVICE: 'terminal-device.sensitive.read',
  DISABLE_DEVICE: 'terminal-device.status.disable',
  MARK_LOST_DEVICE: 'terminal-device.status.mark-lost',
  MARK_MAINTENANCE_DEVICE: 'terminal-device.status.mark-maintenance',
  RESTORE_ACTIVE_DEVICE: 'terminal-device.status.restore-active',
  MANAGE_VERSION_POLICY: 'terminal-device.version-policy.manage',
  READ_AUDIT: 'terminal-device.audit.read',
  UPDATE_DEVICE: 'terminal-device.update'
} as const

export const TERMINAL_DEVICE_MANAGEMENT_PERMISSION_DEFINITIONS = {
  ownerService: 'terminal-device-service',
  permissions: {
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.CREATE_ENROLLMENT]: {
      description: '创建受管终端设备 enrollment',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.REVOKE_ENROLLMENT]: {
      description: '撤销未使用的受管终端设备 enrollment',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_DEVICE]: {
      description: '查看受管终端设备列表与基础详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_SENSITIVE_DEVICE]: {
      description: '查看受管终端设备敏感诊断标识与运行详情',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.DISABLE_DEVICE]: {
      description: '禁用受管终端设备',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_LOST_DEVICE]: {
      description: '标记受管终端设备丢失',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MARK_MAINTENANCE_DEVICE]: {
      description: '标记受管终端设备维修中',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.RESTORE_ACTIVE_DEVICE]: {
      description: '将受管终端设备恢复为可用状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.MANAGE_VERSION_POLICY]: {
      description: '维护受管终端设备版本策略',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.READ_AUDIT]: {
      description: '查看受管终端设备治理审计',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_MANAGEMENT_PERMISSION_CODES.UPDATE_DEVICE]: {
      description: '更新受管终端设备展示字段',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
