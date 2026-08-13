import { Global, Module } from '@nestjs/common'
import { HrPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { HrPartyMachineSourceCredentialClient } from '../infrastructure/adapters/hr-party-machine-source-credential.client'
import { HrPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/hr-party-machine-source-credential.provider'
import { HrPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/hr-party-execution-token-exchange.client'
import { HrPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/hr-party-trusted-grpc-execution.producer'
@Global() @Module({ providers: [HrPartyTrustedGrpcClient, HrPartyMachineSourceCredentialClient, HrPartyMachineSourceCredentialProvider, HrPartyExecutionTokenExchangeClient, { provide: HrPartyTrustedGrpcExecutionProducer, useFactory: (source: HrPartyMachineSourceCredentialProvider, exchange: HrPartyExecutionTokenExchangeClient) => new HrPartyTrustedGrpcExecutionProducer(source, exchange), inject: [HrPartyMachineSourceCredentialProvider, HrPartyExecutionTokenExchangeClient] }], exports: [HrPartyTrustedGrpcClient, HrPartyTrustedGrpcExecutionProducer] })
export class HrTrustedExecutionModule {}
