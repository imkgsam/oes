import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Gateway's certificate-authenticated dedicated channel for Collaboration BUSINESS calls. */
export class GatewayCollaborationGrpcClient {
  private client?: ClientGrpc

  /** Lazily creates the fixed Collaboration gRPC channel and refuses caller-supplied destinations. */
  getClient(): ClientGrpc {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'collaboration_service',
        protoPath: resolveCommonProtoPath('collaboration_service/collaboration.proto'),
        url: resolveCollaborationGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return this.client
  }
}

/** Resolves Collaboration's deployment endpoint from fixed environment configuration. */
function resolveCollaborationGrpcUrl(): string {
  const host = process.env.COLLABORATION_SERVICE_HOST?.trim()
  const port = process.env.COLLABORATION_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50068'
  throw new Error('COLLABORATION_SERVICE_HOST and COLLABORATION_SERVICE_PORT are required')
}
