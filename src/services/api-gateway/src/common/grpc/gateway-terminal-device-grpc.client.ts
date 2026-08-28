import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import type { ChannelOptions } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

const TERMINAL_DEVICE_SPIFFE_ID = 'spiffe://local.oes.internal/ns/oes/sa/terminal-device-service'

/** Owns Gateway's mTLS channel for the token-only Terminal Device server. */
export class GatewayTerminalDeviceGrpcClient {
  private client?: ClientGrpc

  /** Lazily creates the deployment-authenticated generated Terminal Device channel. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'terminal_device_service',
        protoPath: resolveCommonProtoPath('terminal_device_service/terminal_device.proto'),
        url: resolveTerminalDeviceGrpcUrl(),
        credentials: createGrpcClientCredentials(process.env, TERMINAL_DEVICE_SPIFFE_ID),
        channelOptions: resolveTerminalDeviceGrpcChannelOptions()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

export function resolveTerminalDeviceGrpcUrl(): string {
  const host = process.env.TERMINAL_DEVICE_SERVICE_HOST?.trim()
  const port = process.env.TERMINAL_DEVICE_SERVICE_PORT?.trim()
  if (host && port) {
    const connectHost = host === 'localhost' || host.endsWith('.localhost') ? '127.0.0.1' : host
    return `${connectHost}:${port}`
  }
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50057'
  throw new Error('TERMINAL_DEVICE_SERVICE_HOST and TERMINAL_DEVICE_SERVICE_PORT are required')
}

/** Preserves the certificate authority name when a local service hostname is connected over IPv4. */
export function resolveTerminalDeviceGrpcChannelOptions(): ChannelOptions | undefined {
  const host = process.env.TERMINAL_DEVICE_SERVICE_HOST?.trim()
  if (host !== 'localhost' && !host?.endsWith('.localhost')) return undefined
  const authority = host === 'localhost' ? 'terminal-device-service.localhost' : host
  return {
    'grpc.ssl_target_name_override': authority,
    'grpc.default_authority': authority
  }
}
