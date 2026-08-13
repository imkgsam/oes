import { Global, Module } from '@nestjs/common'
import { TenantOrgPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { TenantOrgPartyMachineSourceCredentialClient } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.client'
import { TenantOrgPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/tenant-org-party-machine-source-credential.provider'
import { TenantOrgPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/tenant-org-party-execution-token-exchange.client'
import { TenantOrgPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/tenant-org-party-trusted-grpc-execution.producer'
@Global() @Module({ providers: [TenantOrgPartyTrustedGrpcClient, TenantOrgPartyMachineSourceCredentialClient, TenantOrgPartyMachineSourceCredentialProvider, TenantOrgPartyExecutionTokenExchangeClient, { provide: TenantOrgPartyTrustedGrpcExecutionProducer, useFactory: (source: TenantOrgPartyMachineSourceCredentialProvider, exchange: TenantOrgPartyExecutionTokenExchangeClient) => new TenantOrgPartyTrustedGrpcExecutionProducer(source, exchange), inject: [TenantOrgPartyMachineSourceCredentialProvider, TenantOrgPartyExecutionTokenExchangeClient] }], exports: [TenantOrgPartyTrustedGrpcClient, TenantOrgPartyTrustedGrpcExecutionProducer] })
export class TenantOrgTrustedExecutionModule {}
