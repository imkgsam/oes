import { Global, Module } from '@nestjs/common'
import { SrmPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { SrmPartyMachineSourceCredentialClient } from '../infrastructure/adapters/srm-party-machine-source-credential.client'
import { SrmPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/srm-party-machine-source-credential.provider'
import { SrmPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/srm-party-execution-token-exchange.client'
import { SrmPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/srm-party-trusted-grpc-execution.producer'
@Global() @Module({ providers: [SrmPartyTrustedGrpcClient, SrmPartyMachineSourceCredentialClient, SrmPartyMachineSourceCredentialProvider, SrmPartyExecutionTokenExchangeClient, { provide: SrmPartyTrustedGrpcExecutionProducer, useFactory: (source: SrmPartyMachineSourceCredentialProvider, exchange: SrmPartyExecutionTokenExchangeClient) => new SrmPartyTrustedGrpcExecutionProducer(source, exchange), inject: [SrmPartyMachineSourceCredentialProvider, SrmPartyExecutionTokenExchangeClient] }], exports: [SrmPartyTrustedGrpcClient, SrmPartyTrustedGrpcExecutionProducer] })
export class SrmTrustedExecutionModule {}
