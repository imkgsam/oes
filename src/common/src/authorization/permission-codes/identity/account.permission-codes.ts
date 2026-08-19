import type { PermissionDefinitionGroup } from '../types'

export const IDENTITY_ACCOUNT_PERMISSION_CODES = {
  LIST_ACCOUNT: 'identity.account.list',
  CREATE_ACCOUNT: 'identity.account.create',
  UPDATE_ACCOUNT_STATUS: 'identity.account.update_status',
  UPDATE_ACCOUNT_PROFILE: 'identity.account.profile.update',
  DELETE_ACCOUNT: 'identity.account.delete',
  ASSIGN_CONTACT_ASSET: 'identity.contact.asset.assign',
  UPDATE_CONTACT_ASSET: 'identity.contact.asset.update',
  SET_CONTACT_ASSET_STATUS: 'identity.contact.asset.set_status',
  SET_PRIMARY_CONTACT_ASSET: 'identity.contact.asset.set_primary',
  RELEASE_CONTACT_ASSET: 'identity.contact.asset.release',
  ASSIGN_WORK_EMAIL: 'identity.contact.work_email.assign',
  REVOKE_WORK_EMAIL: 'identity.contact.work_email.revoke',
  SET_PRIMARY_WORK_EMAIL: 'identity.contact.work_email.set_primary',
  SET_WORK_EMAIL_STATUS: 'identity.contact.work_email.set_status',
  ASSIGN_WORK_PHONE: 'identity.contact.work_phone.assign',
  REVOKE_WORK_PHONE: 'identity.contact.work_phone.revoke',
  SET_PRIMARY_WORK_PHONE: 'identity.contact.work_phone.set_primary',
  SET_WORK_PHONE_STATUS: 'identity.contact.work_phone.set_status'
} as const

export const IDENTITY_ACCOUNT_PERMISSION_DEFINITIONS = {
  ownerService: 'identity-service',
  permissions: {
    [IDENTITY_ACCOUNT_PERMISSION_CODES.LIST_ACCOUNT]: {
      description: '查看账号列表',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT]: {
      description: '创建账号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_STATUS]: {
      description: '更新账号启停状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.UPDATE_ACCOUNT_PROFILE]: {
      description: '更新账号档案信息',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.DELETE_ACCOUNT]: {
      description: '删除账号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_WORK_EMAIL]: {
      description: '分配工作邮箱',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.REVOKE_WORK_EMAIL]: {
      description: '回收工作邮箱',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_WORK_EMAIL]: {
      description: '设置主工作邮箱',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_WORK_EMAIL_STATUS]: {
      description: '更新工作邮箱状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.ASSIGN_WORK_PHONE]: {
      description: '分配工作手机号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.REVOKE_WORK_PHONE]: {
      description: '回收工作手机号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_PRIMARY_WORK_PHONE]: {
      description: '设置主工作手机号',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    },
    [IDENTITY_ACCOUNT_PERMISSION_CODES.SET_WORK_PHONE_STATUS]: {
      description: '更新工作手机号状态',
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['TENANT'],
      externalApiEligible: false
    }
  }
} as const satisfies PermissionDefinitionGroup
