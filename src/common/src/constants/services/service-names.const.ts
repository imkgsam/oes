export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  ASSET: 'asset-service',
  AUTH: 'auth-service',
  CRM: 'crm-service',
  FINANCE: 'finance-service',
  HR: 'hr-service',
  IDENTITY: 'identity-service',
  ITEM_MASTER: 'item-master-service',
  MES: 'mes-service',
  PERMISSION: 'permission-service',
  NOTIFICATION: 'notification-service',
  PARTY: 'party-service',
  PROCUREMENT: 'procurement-service',
  SRM: 'srm-service',
  TENANT_ORG: 'tenant-org-service',
  TERMINAL_DEVICE: 'terminal-device-service',
  RESOURCE: 'resource-service',
  WMS: 'wms-service'
} as const

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES]
