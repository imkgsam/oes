import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { PARTY_REGISTRATION_PORT, TENANT_ORG_REFERENCE_PORT } from '../../application/ports'
import { PartyRegistrationGrpcAdapter } from '../adapters/party-registration-grpc.adapter'
import { HrPartyTrustedGrpcClient } from '../adapters/party-trusted-grpc.client'
import { HrPartyMachineSourceCredentialClient } from '../adapters/hr-party-machine-source-credential.client'
import { HrPartyMachineSourceCredentialProvider } from '../adapters/hr-party-machine-source-credential.provider'
import { HrPartyExecutionTokenExchangeClient } from '../adapters/hr-party-execution-token-exchange.client'
import { HrPartyTrustedGrpcExecutionProducer } from '../adapters/hr-party-trusted-grpc-execution.producer'
import {
  TENANT_ORG_GRPC_CLIENT,
  TenantOrgGrpcAdapter
} from '../adapters/tenant-org-grpc.adapter'

/** resolveDownstreamGrpcUrl resolves standard service URLs first while preserving legacy local env names. */
function resolveDownstreamGrpcUrl(
  standardEnvKey: string,
  legacyEnvKey: string,
  fallbackUrl: string
): string | undefined {
  const standardUrl = process.env[standardEnvKey]?.trim()
  if (standardUrl) {
    return standardUrl
  }

  const legacyUrl = process.env[legacyEnvKey]?.trim()
  if (legacyUrl) {
    return legacyUrl
  }

  if ((process.env.NODE_ENV ?? 'development') !== 'production') {
    return fallbackUrl
  }

  return undefined
}

/** buildHrReferenceGrpcClients declares shared HR reference downstream clients with canonical local ports. */
export function buildHrReferenceGrpcClients(): ClientProviderOptions[] {
  return [
    {
      name: TENANT_ORG_GRPC_CLIENT,
      transport: Transport.GRPC,
      options: {
        package: 'tenant_org_service',
        protoPath: [resolveCommonProtoPath('tenant_org_service/tenant_org.proto')],
        url: resolveDownstreamGrpcUrl('GRPC_SERVICE_TENANT_ORG_URL', 'TENANT_ORG_GRPC_URL', '127.0.0.1:50054')
      }
    },
  ]
}

/** HrReferenceModule wires HR anti-corruption ports for external tenant-org and party references. */
@Module({
  imports: [
    AuthorizationModule,
    ClientsModule.register(buildHrReferenceGrpcClients())
  ],
  providers: [
    {
      provide: TENANT_ORG_REFERENCE_PORT,
      useClass: TenantOrgGrpcAdapter
    },
    {
      provide: PARTY_REGISTRATION_PORT,
      useClass: PartyRegistrationGrpcAdapter
    },
    HrPartyTrustedGrpcClient, HrPartyMachineSourceCredentialClient,
    HrPartyMachineSourceCredentialProvider, HrPartyExecutionTokenExchangeClient,
    { provide: HrPartyTrustedGrpcExecutionProducer, useFactory: (source: HrPartyMachineSourceCredentialProvider, exchange: HrPartyExecutionTokenExchangeClient) => new HrPartyTrustedGrpcExecutionProducer(source, exchange), inject: [HrPartyMachineSourceCredentialProvider, HrPartyExecutionTokenExchangeClient] }
  ],
  exports: [TENANT_ORG_REFERENCE_PORT, PARTY_REGISTRATION_PORT]
})
export class HrReferenceModule {}
