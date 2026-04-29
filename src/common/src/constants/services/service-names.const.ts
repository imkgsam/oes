export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  ASSET: 'asset-service',
  AUTH: 'auth-service',
  CRM: 'crm-service',
  FINANCE: 'finance-service',
  HR: 'hr-service',
  IDENTITY: 'identity-service',
  ITEM_MASTER: 'item-master-service',
  PERMISSION: 'permission-service',
  NOTIFICATION: 'notification-service',
  PARTY: 'party-service',
  PROCUREMENT: 'procurement-service',
  SRM: 'srm-service',
  TENANT_ORG: 'tenant-org-service',
  RESOURCE: 'resource-service'
} as const

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES]
