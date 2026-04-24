export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  ASSET: 'asset-service',
  AUTH: 'auth-service',
  HR: 'hr-service',
  IDENTITY: 'identity-service',
  PERMISSION: 'permission-service',
  NOTIFICATION: 'notification-service',
  PARTY: 'party-service',
  TENANT_ORG: 'tenant-org-service',
  RESOURCE: 'resource-service'
} as const

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES]
