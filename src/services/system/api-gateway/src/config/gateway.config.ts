import { registerAs } from '@nestjs/config'

export const gatewayConfig = registerAs('gateway', () => ({
  port: parseInt(process.env.API_GATEWAY_PORT ?? '9101', 10),
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api/v1',
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') ?? ['*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10)
  },
  timeout: {
    requestMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? '10000', 10)
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false'
  }
}))
