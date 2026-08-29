import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import type { ChannelOptions } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

export const TERMINAL_DEVICE_PEER_SPIFFE_ENV = 'GATEWAY_TERMINAL_DEVICE_PEER_SPIFFE_ID'

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
        credentials: createGrpcClientCredentials(process.env, resolveTerminalDevicePeerSpiffeId()),
        channelOptions: resolveTerminalDeviceGrpcChannelOptions()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

/** Requires the deployment-projected exact Terminal Device peer SPIFFE URI. */
export function resolveTerminalDevicePeerSpiffeId(
  environment: NodeJS.ProcessEnv = process.env
): string {
  const value = environment[TERMINAL_DEVICE_PEER_SPIFFE_ENV]?.trim()
  try {
    if (!value || value.includes('*') || decodeURIComponent(value).includes('*')) throw new Error()
    const parsed = new URL(value)
    if (
      parsed.protocol !== 'spiffe:' ||
      !parsed.hostname ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !/^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/u.test(parsed.pathname) ||
      parsed.href !== value
    )
      throw new Error()
    return value
  } catch {
    throw new Error(`${TERMINAL_DEVICE_PEER_SPIFFE_ENV} must be an exact SPIFFE ID`)
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
