import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  CRM_OBJECT_REFERENCE_SERVICE_NAME,
  CrmObjectReferenceServiceClient
} from '@oes/common/generated/crm_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

/** Owns Collaboration's dedicated mTLS channel for CRM object-reference validation. */
export class CollaborationCrmTrustedGrpcClient {
  private client?: ClientGrpc

  /** Returns CRM's INTERNAL object-reference stub from Collaboration's dedicated channel. */
  objectReference(): CrmObjectReferenceServiceClient {
    return this.get().getService<CrmObjectReferenceServiceClient>(CRM_OBJECT_REFERENCE_SERVICE_NAME)
  }

  /** Lazily creates one CRM channel without generic registration or insecure fallback. */
  private get(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'crm_service',
        protoPath: resolveCommonProtoPath('crm_service/crm.proto'),
        url: resolveCrmGrpcUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Resolves CRM's endpoint while requiring explicit production configuration. */
function resolveCrmGrpcUrl(): string {
  const direct = process.env.GRPC_SERVICE_CRM_URL?.trim() || process.env.CRM_GRPC_URL?.trim()
  if (direct) return direct
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50060'
  throw new Error('GRPC_SERVICE_CRM_URL is required')
}
