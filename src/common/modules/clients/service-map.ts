//作用： 记录所有微服务的配置和客户端令牌
// File:  src/common/modules/clients/service-map.ts
import { IServiceEndpointConfig } from './client-factory'

export const SERVICE_ENDPOINTS_CONFIG: Record<string, IServiceEndpointConfig> = {
  IM_TCP: {
    protocol: 'TCP',
    serviceName: 'IM-SERVICE',
    port: 11002,
    host: 'localhost'
  },
  MAIL_TCP: {
    protocol: 'TCP',
    serviceName: 'MAIL-SERVICE',
    port: 11302,
    host: 'localhost'
  },
  ASSET_TCP: {
    protocol: 'TCP',
    serviceName: 'ASSET-SERVICE',
    port: 11402,
    host: 'localhost'
  },
  ERP_TCP: {
    protocol: 'TCP',
    serviceName: 'ERP-SERVICE',
    port: 11202,
    host: 'localhost'
  },
  MES_TCP: {
    protocol: 'TCP',
    serviceName: 'MES-SERVICE',
    port: 11102,
    host: 'localhost'
  },
  RESOURCE_TCP: {
    protocol: 'TCP',
    serviceName: 'RESOURCE-SERVICE',
    port: 11502,
    host: 'localhost'
  },
  AUTH_TCP: {
    protocol: 'TCP',
    serviceName: 'AUTH-SERVICE',
    port: 9202,
    host: 'localhost'
  },
  IDENTITY_TCP: {
    protocol: 'TCP',
    serviceName: 'IDENTITY-SERVICE',
    port: 9402,
    host: 'localhost'
  },
  PERMISSION_TCP: {
    protocol: 'TCP',
    serviceName: 'PERMISSION-SERVICE',
    port: 9302,
    host: 'localhost'
  }
}

export const SERVICE_CLIENT_TOKENS = Object.fromEntries(
  Object.keys(SERVICE_ENDPOINTS_CONFIG).map((key, _) => [key, `${key}_CLIENT`])
) as Record<keyof typeof SERVICE_ENDPOINTS_CONFIG, string>

export const ServiceKeys = Object.keys(SERVICE_ENDPOINTS_CONFIG).reduce(
  (acc, key) => {
    acc[key] = key
    return acc
  },
  {} as Record<keyof typeof SERVICE_ENDPOINTS_CONFIG, string>
)
