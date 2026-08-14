import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  SRM_INTERNAL_QUERY_SERVICE_NAME,
  SrmInternalQueryServiceClient
} from '@oes/common/generated/srm_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Procurement's prepared mTLS channel for SRM's two narrow INTERNAL queries. */
export class ProcurementSrmInternalTrustedGrpcClient {
  private client?: ClientGrpc

  internalQuery(): SrmInternalQueryServiceClient {
    return this.get().getService<SrmInternalQueryServiceClient>(SRM_INTERNAL_QUERY_SERVICE_NAME)
  }

  /** Lazily creates a dedicated SRM channel without generic transport fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'srm_service',
        protoPath: resolveCommonProtoPath('srm_service/srm.proto'),
        url: process.env.GRPC_SERVICE_SRM_URL?.trim() || '127.0.0.1:50061',
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}
