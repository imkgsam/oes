import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { registerAs } from '@nestjs/config'

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
      [SERVICE_NAMES.AUTH]: {
        serviceName: SERVICE_NAMES.AUTH,
        protoPath: resolveCommonProtoPath('auth_service/auth.proto'),
        packageName: 'auth_service',
        url:
          process.env.AUTH_SERVICE_HOST && process.env.AUTH_SERVICE_PORT
            ? `${process.env.AUTH_SERVICE_HOST}:${process.env.AUTH_SERVICE_PORT}`
            : undefined
      },
      [SERVICE_NAMES.PERMISSION]: {
        serviceName: SERVICE_NAMES.PERMISSION,
        protoPath: [
          resolveCommonProtoPath('permission_service/permission_management.proto'),
          resolveCommonProtoPath('permission_service/permission_check.proto'),
          resolveCommonProtoPath('permission_service/permission_access_summary.proto')
        ],
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
