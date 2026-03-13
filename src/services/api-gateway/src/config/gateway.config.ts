import { registerAs } from '@nestjs/config'
import { join } from 'path'

export const gatewayConfig = registerAs('gateway', () => ({
  port: parseInt(process.env.SERVICE_PORT ?? '9100', 10),
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
  },

  // ── gRPC downstream services ──
  grpc: {
    services: {
      'permission-service': {
        serviceName: 'permission-service',
        protoPath: join(
          __dirname,
          '../../../../../common/src/contracts/permission_service/permission_management.proto'
        ),
        packageName: 'permission_service',
        // Static URL fallback (used when Nacos discovery is unavailable)
        url:
          process.env.PERMISSION_SERVICE_HOST && process.env.PERMISSION_SERVICE_PORT
            ? `${process.env.PERMISSION_SERVICE_HOST}:${process.env.PERMISSION_SERVICE_PORT}`
            : undefined
      }
    }
  }
}))
