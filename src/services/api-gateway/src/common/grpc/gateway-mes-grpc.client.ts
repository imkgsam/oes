import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's certificate-authenticated dedicated channel for MES BUSINESS calls. */
export class GatewayMesGrpcClient {
  private client?: ClientGrpc
  /** Lazily creates the fixed MES gRPC channel and refuses caller-supplied destinations. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({ transport: Transport.GRPC, options: {
      package: 'mes_service', protoPath: resolveCommonProtoPath('mes_service/mes.proto'), url: resolveMesGrpcUrl(), credentials: createGrpcClientCredentials()
    } }) as unknown as ClientGrpc
    return this.client
  }
}

/** Resolves MES's deployment endpoint from fixed environment configuration. */
function resolveMesGrpcUrl(): string {
  const host = process.env.MES_SERVICE_HOST?.trim()
  const port = process.env.MES_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50065'
  throw new Error('MES_SERVICE_HOST and MES_SERVICE_PORT are required')
}
