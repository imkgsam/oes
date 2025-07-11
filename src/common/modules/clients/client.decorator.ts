// 装饰器注入微服务代理
import { Inject } from '@nestjs/common'
import { SERVICE_CLIENT_TOKENS } from './service-map'

export function InjectServiceClient(
  serviceKey: keyof typeof SERVICE_CLIENT_TOKENS,
) {
  return Inject(SERVICE_CLIENT_TOKENS[serviceKey])
}
