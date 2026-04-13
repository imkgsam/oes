export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  AUTH: 'auth-service',
  IDENTITY: 'identity-service',
  PERMISSION: 'permission-service',
  NOTIFICATION: 'notification-service',
  ENTITY: 'entity-service',
  RESOURCE: 'resource-service'
} as const

export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES]
