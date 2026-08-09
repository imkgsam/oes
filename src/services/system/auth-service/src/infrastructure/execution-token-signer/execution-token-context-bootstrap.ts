import { TrustedExecutionRegistry } from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import type { WorkloadIssuancePolicy } from '../../domain/services/execution-token-registry'
import { AuthGrpcVerifiedPeerAdapter } from './auth-grpc-security'
import {
  ExecutionTokenPermissionDecisionResolver,
  ExecutionTokenSourceCredentialVerifier,
  VerifiedExecutionTokenContextProvider
} from './verified-execution-token-context.provider'

export type ExecutionTokenContextConfiguration = Readonly<{
  issuer: string
  workloadPolicies: readonly WorkloadIssuancePolicy[]
}>

/** Creates the sole STS context boundary from Common's authenticated transport identity provider and immutable deployment policy. */
export function createVerifiedExecutionTokenContext(
  configuration: ExecutionTokenContextConfiguration,
  sourceCredentialVerifier: ExecutionTokenSourceCredentialVerifier,
  permissionDecisionResolver: ExecutionTokenPermissionDecisionResolver
): VerifiedExecutionTokenContextProvider {
  const trustedRegistry = new TrustedExecutionRegistry({
    issuer: configuration.issuer,
    audiences: [...new Set(configuration.workloadPolicies.flatMap((policy) => policy.audiences))],
    workloadIdentities: configuration.workloadPolicies.map((policy) => policy.spiffeId)
  })
  return new VerifiedExecutionTokenContextProvider(
    new GrpcWorkloadIdentityProvider({
      registry: trustedRegistry,
      adapter: new AuthGrpcVerifiedPeerAdapter()
    }),
    sourceCredentialVerifier,
    permissionDecisionResolver
  )
}
