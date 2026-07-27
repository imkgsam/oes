import { createHash } from 'node:crypto'
import {
  TrustedExecutionRegistry,
  VerifiedWorkloadIdentity
} from '../../authorization/trusted-execution'

/** Carries peer evidence returned only after the selected transport adapter authenticates the channel. */
export type TransportVerifiedGrpcPeer = {
  readonly transportVerified: boolean
  readonly spiffeId: string
  readonly certificateDer: Uint8Array
}

/** Adapts a deployment-specific authenticated gRPC transport boundary without consulting request metadata. */
export interface GrpcVerifiedPeerAdapter<TCall = unknown> {
  resolveVerifiedPeer(call: TCall): Promise<TransportVerifiedGrpcPeer | undefined>
}

/** Configures workload identity derivation from one transport adapter and immutable deployment registry. */
export type GrpcWorkloadIdentityProviderOptions<TCall = unknown> = {
  readonly registry: TrustedExecutionRegistry
  readonly adapter: GrpcVerifiedPeerAdapter<TCall>
}

/** Converts transport-authenticated SPIFFE and leaf-certificate evidence into immutable verifier input. */
export class GrpcWorkloadIdentityProvider<TCall = unknown> {
  private readonly registry: TrustedExecutionRegistry
  private readonly adapter: GrpcVerifiedPeerAdapter<TCall>

  constructor(options: GrpcWorkloadIdentityProviderOptions<TCall>) {
    this.registry = options.registry
    this.adapter = options.adapter
  }

  /** Resolves only transport-verified peer evidence and rejects missing or unregistered workloads. */
  async getVerifiedWorkloadIdentity(call: TCall): Promise<VerifiedWorkloadIdentity> {
    const peer = await this.adapter.resolveVerifiedPeer(call)
    if (peer === undefined || peer.transportVerified !== true) {
      throw new Error('gRPC workload identity is not verified by the transport boundary')
    }
    this.registry.assertWorkloadIdentity(peer.spiffeId)
    if (!(peer.certificateDer instanceof Uint8Array) || peer.certificateDer.byteLength === 0) {
      throw new Error('gRPC transport did not provide a verified client leaf certificate')
    }

    return Object.freeze({
      spiffeId: peer.spiffeId,
      certificateThumbprint: createHash('sha256').update(peer.certificateDer).digest('base64url')
    })
  }
}
