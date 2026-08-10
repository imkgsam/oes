import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  BrowserActivityServiceClient,
  BROWSER_ACTIVITY_SERVICE_NAME
} from '@oes/common/generated/browser_activity_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS client channel for the token-only Browser Activity server. */
export class GatewayBrowserActivityGrpcClient {
  private client?: ClientGrpc
  private service?: BrowserActivityServiceClient

  /** Resolves a lazy generated Browser Activity stub on the deployment-authenticated transport. */
  getService(): BrowserActivityServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'browser_activity_service',
        protoPath: resolveCommonProtoPath('browser_activity_service/browser_activity.proto'),
        url: resolveGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service ??= this.client.getService<BrowserActivityServiceClient>(
      BROWSER_ACTIVITY_SERVICE_NAME
    )
    return this.service
  }
}

/** Resolves the Browser Activity endpoint without accepting caller-supplied transport settings. */
function resolveGrpcUrl(): string {
  const host = process.env.BROWSER_ACTIVITY_SERVICE_HOST?.trim()
  const port = process.env.BROWSER_ACTIVITY_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50070'
  throw new Error('BROWSER_ACTIVITY_SERVICE_HOST and BROWSER_ACTIVITY_SERVICE_PORT are required')
}
