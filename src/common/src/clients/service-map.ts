export const ServiceKeys = {
  AUTH_TCP: 'AUTH_TCP',
  PERMISSION_TCP: 'PERMISSION_TCP',
  ENTITY_TCP: 'ENTITY_TCP',
  AUDIT_TCP: 'AUDIT_TCP',
  NOTIFICATION_TCP: 'NOTIFICATION_TCP'
} as const

export type ServiceKey = (typeof ServiceKeys)[keyof typeof ServiceKeys]

export interface ServiceEndpointConfig {
  host: string
  port: number
}

const resolvePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const endpoint = (hostEnv: string, portEnv: string, fallbackPort: number): ServiceEndpointConfig => ({
  host: process.env[hostEnv] ?? 'localhost',
  port: resolvePort(process.env[portEnv], fallbackPort)
})

export const SERVICE_ENDPOINTS_CONFIG = {
  AUTH_TCP: endpoint('AUTH_HOST', 'AUTH_TCP_PORT', 9202),
  PERMISSION_TCP: endpoint('PERMISSION_HOST', 'PERMISSION_TCP_PORT', 9302),
  ENTITY_TCP: endpoint('ENTITY_HOST', 'ENTITY_TCP_PORT', 9502),
  AUDIT_TCP: endpoint('AUDIT_HOST', 'AUDIT_TCP_PORT', 9602),
  NOTIFICATION_TCP: endpoint('NOTIFICATION_HOST', 'NOTIFICATION_TCP_PORT', 9702)
} as const satisfies Record<ServiceKey, ServiceEndpointConfig>
