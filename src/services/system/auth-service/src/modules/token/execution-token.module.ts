import { Module } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { EXECUTION_TOKEN_EXCHANGE_CONTEXT } from '../../application/ports/execution-token-exchange-context.port'
import { ExecutionTokenExchangeService } from '../../application/services/execution-token-exchange.service'
import { ExecutionTokenJwksService } from '../../application/services/execution-token-jwks.service'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import {
  ExecutionTokenRegistry,
  WorkloadIssuancePolicy
} from '../../domain/services/execution-token-registry'
import {
  KmsHsmExecutionTokenClient,
  KmsHsmExecutionTokenSigningAdapter
} from '../../infrastructure/services/kms-hsm-execution-token-signing.adapter'
import {
  createVerifiedExecutionTokenContext,
  ExecutionTokenContextConfiguration
} from '../../infrastructure/execution-token-signer/execution-token-context-bootstrap'
import { UdsSignerClient } from '../../infrastructure/execution-token-signer/uds-signer.client'
import { verifySignerBootstrap } from '../../infrastructure/execution-token-signer/signer-preflight'
import { ExecutionTokenGrpcController } from '../../interfaces/grpc/execution-token.grpc.controller'
import { ExecutionTokenMetadataHttpController } from '../../interfaces/http/execution-token-metadata.http.controller'

const KMS_HSM_EXECUTION_TOKEN_CLIENT = 'KmsHsmExecutionTokenClient'
export const EXECUTION_TOKEN_SIGNER = 'ExecutionTokenSigner'
const EXECUTION_TOKEN_RUNTIME_CONFIGURATION = 'ExecutionTokenRuntimeConfiguration'

type ExecutionTokenRuntimeConfiguration = ExecutionTokenContextConfiguration

/** Assembles the fail-closed STS runtime; deployment must bind trusted context and a protected KMS/HSM client. */
@Module({
  providers: [
    {
      provide: EXECUTION_TOKEN_RUNTIME_CONFIGURATION,
      useFactory: (): ExecutionTokenRuntimeConfiguration =>
        Object.freeze({
          issuer: requireEnv('AUTH_EXECUTION_ISSUER'),
          workloadPolicies: parsePolicies(requireEnv('AUTH_EXECUTION_WORKLOAD_POLICIES'))
        })
    },
    {
      provide: ExecutionTokenRegistry,
      useFactory: (configuration: ExecutionTokenRuntimeConfiguration) =>
        new ExecutionTokenRegistry(configuration),
      inject: [EXECUTION_TOKEN_RUNTIME_CONFIGURATION]
    },
    {
      provide: KMS_HSM_EXECUTION_TOKEN_CLIENT,
      useFactory: (): KmsHsmExecutionTokenClient => {
        requireEnv('AUTH_EXECUTION_KMS_KEY_REF')
        return new UdsSignerClient(requireAbsoluteSocketPath('AUTH_EXECUTION_SIGNER_SOCKET_PATH'))
      },
      inject: []
    },
    {
      provide: EXECUTION_TOKEN_SIGNER,
      useFactory: (client: KmsHsmExecutionTokenClient) => bootstrapProtectedSigner(client),
      inject: [KMS_HSM_EXECUTION_TOKEN_CLIENT]
    },
    {
      provide: ExecutionTokenExchangeService,
      useFactory: (registry: ExecutionTokenRegistry, signer: ExecutionTokenSigningPort) =>
        new ExecutionTokenExchangeService(registry, signer),
      inject: [ExecutionTokenRegistry, EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: ExecutionTokenJwksService,
      useFactory: (registry: ExecutionTokenRegistry, signer: ExecutionTokenSigningPort) =>
        new ExecutionTokenJwksService(registry, signer),
      inject: [ExecutionTokenRegistry, EXECUTION_TOKEN_SIGNER]
    },
    {
      provide: EXECUTION_TOKEN_EXCHANGE_CONTEXT,
      useFactory: (configuration: ExecutionTokenRuntimeConfiguration) =>
        createVerifiedExecutionTokenContext(configuration),
      inject: [EXECUTION_TOKEN_RUNTIME_CONFIGURATION]
    }
  ],
  controllers: [ExecutionTokenGrpcController, ExecutionTokenMetadataHttpController],
  exports: [EXECUTION_TOKEN_SIGNER]
})
export class ExecutionTokenModule {}

/** Reads mandatory non-secret deployment configuration while refusing permissive local fallbacks. */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
/** Parses only deployment-owned SPIFFE-to-audience policy facts, never request-supplied registry data. */
function parsePolicies(value: string): readonly WorkloadIssuancePolicy[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) throw new Error('not an array')
    return parsed as readonly WorkloadIssuancePolicy[]
  } catch {
    throw new Error('AUTH_EXECUTION_WORKLOAD_POLICIES must be valid JSON')
  }
}
/** Reads the sole permitted pod-local signer endpoint and rejects TCP, DNS, and relative-path substitutions. */
function requireAbsoluteSocketPath(name: string): string {
  const value = requireEnv(name)
  if (!value.startsWith('/')) throw new Error(`${name} must be an absolute Unix socket path`)
  return value
}
/** Performs Auth startup's public-key timeline and sign/verify challenge before exposing STS or JWKS routes. */
async function bootstrapProtectedSigner(
  client: KmsHsmExecutionTokenClient
): Promise<ExecutionTokenSigningPort> {
  const signer = new KmsHsmExecutionTokenSigningAdapter(client)
  const active = await signer.currentSigningKey()
  const published = await signer.publishedKeys()
  if (!published.some((key) => key.kid === active.kid))
    throw new Error('active signer key is not published')
  const challenge = randomBytes(32)
  verifySignerBootstrap(active.publicJwk, challenge, await signer.sign(active.kid, challenge))
  return signer
}
