import { Global, Module } from '@nestjs/common'
import { PartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { CrmPartyMachineSourceCredentialClient } from '../infrastructure/adapters/crm-party-machine-source-credential.client'
import { CrmPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/crm-party-machine-source-credential.provider'
import { CrmPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/crm-party-execution-token-exchange.client'
import { CrmPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/crm-party-trusted-grpc-execution.producer'
@Global() @Module({ providers: [PartyTrustedGrpcClient, CrmPartyMachineSourceCredentialClient, CrmPartyMachineSourceCredentialProvider, CrmPartyExecutionTokenExchangeClient, { provide: CrmPartyTrustedGrpcExecutionProducer, useFactory: (source: CrmPartyMachineSourceCredentialProvider, exchange: CrmPartyExecutionTokenExchangeClient) => new CrmPartyTrustedGrpcExecutionProducer(source, exchange), inject: [CrmPartyMachineSourceCredentialProvider, CrmPartyExecutionTokenExchangeClient] }], exports: [PartyTrustedGrpcClient, CrmPartyTrustedGrpcExecutionProducer] })
export class CrmTrustedExecutionModule {}
