import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import type { ClientProviderOptions } from '@nestjs/microservices/module/interfaces'
import { AuthorizationModule } from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { createGrpcClientCredentials } from '@oes/common/transport'
import { PARTY_REGISTRATION_PORT, TENANT_ORG_REFERENCE_PORT } from '../../application/ports'
import { PartyRegistrationGrpcAdapter } from '../adapters/party-registration-grpc.adapter'
import { HrPartyTrustedGrpcClient } from '../adapters/party-trusted-grpc.client'
import { HrPartyMachineSourceCredentialClient } from '../adapters/hr-party-machine-source-credential.client'
import { HrPartyMachineSourceCredentialProvider } from '../adapters/hr-party-machine-source-credential.provider'
import { HrPartyExecutionTokenExchangeClient } from '../adapters/hr-party-execution-token-exchange.client'
import { HrPartyTrustedGrpcExecutionProducer } from '../adapters/hr-party-trusted-grpc-execution.producer'
import { HrTrustedExecutionModule } from '../../modules/hr-trusted-execution.module'
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

/** Adds mandatory workload credentials and rejects an unresolved production target URL. */
function createMtlsClientProvider(client: ClientProviderOptions): ClientProviderOptions {
  if (!('transport' in client) || client.transport !== Transport.GRPC || !('options' in client) || !('url' in client.options) || !client.options.url) {
    throw new Error('HR_FOUNDATION_EXECUTION_UNAVAILABLE')
  }
  return {
    ...client,
    options: { ...client.options, credentials: createGrpcClientCredentials() }
  } as ClientProviderOptions
}

/** HrReferenceModule wires HR anti-corruption ports for external tenant-org and party references. */
@Module({
  imports: [
    AuthorizationModule, HrTrustedExecutionModule,
    ClientsModule.registerAsync(
      buildHrReferenceGrpcClients().map((client) => ({
        name: client.name,
        useFactory: () => createMtlsClientProvider(client)
      }))
    )
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
  ],
  exports: [TENANT_ORG_REFERENCE_PORT, PARTY_REGISTRATION_PORT]
})
export class HrReferenceModule {}
