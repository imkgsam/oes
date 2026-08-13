import { Global, Module } from '@nestjs/common'
import { IdentityPartyTrustedGrpcClient } from '../infrastructure/adaptors/party-trusted-grpc.client'
import { IdentityPartyMachineSourceCredentialClient } from '../infrastructure/adaptors/identity-party-machine-source-credential.client'
import { IdentityPartyMachineSourceCredentialProvider } from '../infrastructure/adaptors/identity-party-machine-source-credential.provider'
import { IdentityPartyExecutionTokenExchangeClient } from '../infrastructure/adaptors/identity-party-execution-token-exchange.client'
import { IdentityPartyTrustedGrpcExecutionProducer } from '../infrastructure/adaptors/identity-party-trusted-grpc-execution.producer'
@Global() @Module({ providers: [IdentityPartyTrustedGrpcClient, IdentityPartyMachineSourceCredentialClient, IdentityPartyMachineSourceCredentialProvider, IdentityPartyExecutionTokenExchangeClient, { provide: IdentityPartyTrustedGrpcExecutionProducer, useFactory: (source: IdentityPartyMachineSourceCredentialProvider, exchange: IdentityPartyExecutionTokenExchangeClient) => new IdentityPartyTrustedGrpcExecutionProducer(source, exchange), inject: [IdentityPartyMachineSourceCredentialProvider, IdentityPartyExecutionTokenExchangeClient] }], exports: [IdentityPartyTrustedGrpcClient, IdentityPartyTrustedGrpcExecutionProducer] })
export class IdentityTrustedExecutionModule {}
