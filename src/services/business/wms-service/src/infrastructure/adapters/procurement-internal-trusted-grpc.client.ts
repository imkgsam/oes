import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  PROCUREMENT_INTERNAL_QUERY_SERVICE_NAME,
  ProcurementInternalQueryServiceClient
} from '@oes/common/generated/procurement_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns WMS's active mTLS channel for Procurement's narrow receipt projection. */
export class WmsProcurementInternalTrustedGrpcClient {
  private client?: ClientGrpc

  internalQuery(): ProcurementInternalQueryServiceClient {
    return this.get().getService<ProcurementInternalQueryServiceClient>(
      PROCUREMENT_INTERNAL_QUERY_SERVICE_NAME
    )
  }

  /** Lazily creates a dedicated Procurement channel without generic transport fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'procurement_service',
        protoPath: resolveCommonProtoPath('procurement_service/procurement.proto'),
        url: process.env.GRPC_SERVICE_PROCUREMENT_URL?.trim() || '127.0.0.1:50062',
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}
