import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'
import { PARTY_QUERY_SERVICE_NAME, PartyQueryServiceClient, PARTY_REGISTRATION_SERVICE_NAME, PartyRegistrationServiceClient } from '@oes/common/generated/party_service'
export class TenantOrgPartyTrustedGrpcClient {
  private client?: ClientGrpc
  query() { return this.get().getService<PartyQueryServiceClient>(PARTY_QUERY_SERVICE_NAME) }
  registration() { return this.get().getService<PartyRegistrationServiceClient>(PARTY_REGISTRATION_SERVICE_NAME) }
  private get() { return this.client ??= ClientProxyFactory.create({ transport: Transport.GRPC, options: { package: 'party_service', protoPath: resolveCommonProtoPath('party_service/party.proto'), url: process.env.GRPC_SERVICE_PARTY_URL?.trim() || '127.0.0.1:50053', credentials: createGrpcClientCredentials() } }) as unknown as ClientGrpc }
}
