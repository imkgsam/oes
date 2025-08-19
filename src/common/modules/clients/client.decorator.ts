// 装饰器注入微服务代理
import { Inject } from '@nestjs/common'
import { SERVICE_CLIENT_TOKENS } from './service-map'

export function InjectServiceClient(serviceKey: keyof typeof SERVICE_CLIENT_TOKENS) {
  const token = SERVICE_CLIENT_TOKENS[serviceKey]

  if (!token) {
    throw new Error(
      `🚨 [InjectServiceClient] 无效的 service key "${serviceKey}"，请确保它在 SERVICE_CLIENT_TOKENS 中已定义。`
    )
  }

  return Inject(token)
}
