import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's mTLS channel for the token-only Terminal Device server. */
export class GatewayTerminalDeviceGrpcClient {
  private client?: ClientGrpc

  /** Lazily creates the deployment-authenticated generated Terminal Device channel. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({ transport: Transport.GRPC, options: { package: 'terminal_device_service', protoPath: resolveCommonProtoPath('terminal_device_service/terminal_device.proto'), url: resolveGrpcUrl(), credentials: createGrpcClientCredentials() } }) as unknown as ClientGrpc
    return this.client
  }
}

function resolveGrpcUrl(): string {
  const host = process.env.TERMINAL_DEVICE_SERVICE_HOST?.trim()
  const port = process.env.TERMINAL_DEVICE_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50057'
  throw new Error('TERMINAL_DEVICE_SERVICE_HOST and TERMINAL_DEVICE_SERVICE_PORT are required')
}
