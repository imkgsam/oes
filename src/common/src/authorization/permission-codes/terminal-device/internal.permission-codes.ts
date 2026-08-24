import type { PermissionDefinitionGroup } from '../types'

export const TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES = {
  ACTIVATE_ENROLLMENT: 'terminal-device.internal.gateway.enrollment.activate',
  RESOLVE_ACCESS: 'terminal-device.internal.gateway.access.resolve',
  RECORD_HEARTBEAT: 'terminal-device.internal.gateway.heartbeat.record',
  RECORD_DIAGNOSTIC_LOG: 'terminal-device.internal.gateway.diagnostic_log.record'
} as const

export const TERMINAL_DEVICE_INTERNAL_PERMISSION_DEFINITIONS = {
  ownerService: 'terminal-device-service',
  permissions: {
    [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.ACTIVATE_ENROLLMENT]: {
      description: 'Gateway MACHINE 激活终端设备 enrollment',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RESOLVE_ACCESS]: {
      description: 'Gateway MACHINE 解析终端设备准入',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RECORD_HEARTBEAT]: {
      description: 'Gateway MACHINE 写入终端设备 heartbeat',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [TERMINAL_DEVICE_INTERNAL_PERMISSION_CODES.RECORD_DIAGNOSTIC_LOG]: {
      description: 'Gateway MACHINE 写入终端设备诊断日志',
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
