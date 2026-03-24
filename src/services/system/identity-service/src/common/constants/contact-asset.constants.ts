export const CONTACT_ASSET_TYPES = {
  WORK_EMAIL: 'WORK_EMAIL',
  WORK_PHONE: 'WORK_PHONE'
} as const

export const CONTACT_ASSET_STATUSES = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  REVOKED: 'REVOKED'
} as const

export const CONTACT_ASSET_PATTERNS = {
  WORK_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  WORK_PHONE: /^\+?[0-9][0-9\- ]{5,19}$/
} as const
