//作用： 记录所有微服务的配置和客户端令牌

import { IServiceEndpointConfig } from './client-factory'

export const SERVICE_ENDPOINTS_CONFIG: Record<string, IServiceEndpointConfig> =
{
  MES_TCP: {
    protocol: 'TCP',
    serviceName: 'MES-SERVICE',
    port: 11102,
    host: 'localhost',
  },
  ERP_TCP: {
    protocol: 'TCP',
    serviceName: 'ERP-SERVICE',
    port: 11202,
    host: 'localhost',
  },
  AUTH_TCP: {
    protocol: 'TCP',
    serviceName: 'AUTH-SERVICE',
    port: 9202,
    host: 'localhost',
  },
  PERMI_TCP: {
    protocol: 'TCP',
    serviceName: 'PERMISSION-SERVICE',
    port: 9302,
    host: 'localhost',
  },
}

export const SERVICE_CLIENT_TOKENS = Object.fromEntries(
  Object.keys(SERVICE_ENDPOINTS_CONFIG).map((key, value) => [
    key,
    `${key}_CLIENT`,
  ]),
) as Record<keyof typeof SERVICE_ENDPOINTS_CONFIG, string>


export const ServiceKeys = Object.keys(SERVICE_ENDPOINTS_CONFIG).reduce((acc, key) => {
  acc[key] = key
  return acc
}, {} as Record<keyof typeof SERVICE_ENDPOINTS_CONFIG, string>)