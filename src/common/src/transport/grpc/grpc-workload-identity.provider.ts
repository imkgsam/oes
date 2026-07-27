import type { VerifiedWorkloadIdentity } from '../../authorization/trusted-execution'

/** Carries the non-forgeable identity facts emitted by the deployment-managed mTLS boundary. */
export interface VerifiedGrpcTlsPeer {
  verifiedByTransport: boolean
  spiffeId?: string
  certificateDer?: Uint8Array
}

/** Converts only a transport-verified mTLS peer result into the runtime's workload-identity value object. */
export class GrpcWorkloadIdentityProvider {
  /** Rejects missing or self-reported peer data before token verification evaluates SPIFFE and cnf bindings. */
  resolve(peer: VerifiedGrpcTlsPeer): VerifiedWorkloadIdentity {
    if (
      !peer.verifiedByTransport ||
      !peer.spiffeId?.startsWith('spiffe://') ||
      !peer.certificateDer?.length
    ) {
      throw new Error('verified mTLS workload identity is required')
    }
    return {
      spiffeId: peer.spiffeId,
      certificateDer: peer.certificateDer
    }
  }
}
