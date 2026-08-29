import { ChannelCredentials, ServerCredentials } from '@grpc/grpc-js'
import { createHash, X509Certificate } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { PeerCertificate } from 'node:tls'
import type {
  GrpcVerifiedPeerAdapter,
  TransportVerifiedGrpcPeer
} from './grpc-workload-identity.provider'
import type { VerifiedWorkloadIdentity } from '../../authorization/trusted-execution'

export type GrpcTlsConfig = Readonly<{
  caPath: string
  certPath: string
  keyPath: string
  workloadSpiffeId: string
}>

export type GrpcAuthenticatedCall = {
  getAuthContext?: () => {
    transportSecurityType?: string
    sslPeerCertificate?: { raw?: Buffer; subjectaltname?: string }
  }
}

/** Adapts only grpc-js mTLS-authenticated peer certificate facts into Common's verified transport interface. */
export class GrpcJsVerifiedPeerAdapter implements GrpcVerifiedPeerAdapter<GrpcAuthenticatedCall> {
  async resolveVerifiedPeer(
    call: GrpcAuthenticatedCall
  ): Promise<TransportVerifiedGrpcPeer | undefined> {
    const context = call?.getAuthContext?.()
    const certificate = context?.sslPeerCertificate
    const spiffeId = readSpiffeId(certificate?.subjectaltname)
    if (
      context?.transportSecurityType !== 'ssl' ||
      !Buffer.isBuffer(certificate?.raw) ||
      certificate.raw.length === 0 ||
      !spiffeId
    ) {
      return undefined
    }

    return Object.freeze({ transportVerified: true, spiffeId, certificateDer: certificate.raw })
  }
}

/** Reads the shared grpc-js TLS deployment bindings and rejects plaintext or incomplete configuration. */
export function readGrpcTlsConfig(environment: NodeJS.ProcessEnv = process.env): GrpcTlsConfig {
  if (environment.OES_GRPC_TLS_ENABLED !== 'true') throw new Error('gRPC mTLS is required')
  if (environment.OES_GRPC_TLS_MIN_VERSION !== 'TLSv1.2') {
    throw new Error('gRPC TLSv1.2 is required')
  }

  const caPath = requireValue(environment, 'OES_GRPC_TLS_CA_PATH')
  const certPath = requireValue(environment, 'OES_GRPC_TLS_CERT_PATH')
  const keyPath = requireValue(environment, 'OES_GRPC_TLS_KEY_PATH')
  const workloadSpiffeId = requireValue(environment, 'OES_WORKLOAD_SPIFFE_ID')
  if (!workloadSpiffeId.startsWith('spiffe://')) {
    throw new Error('OES_WORKLOAD_SPIFFE_ID must be a SPIFFE URI')
  }

  return Object.freeze({ caPath, certPath, keyPath, workloadSpiffeId })
}

/** Builds grpc-js server credentials with CA trust and mandatory client certificate validation. */
export function createGrpcServerCredentials(
  environment: NodeJS.ProcessEnv = process.env
): ServerCredentials {
  const config = readGrpcTlsConfig(environment)
  const rootCerts = readFileSync(config.caPath)
  const certChain = readFileSync(config.certPath)
  const privateKey = readFileSync(config.keyPath)
  const certificate = new X509Certificate(certChain)
  assertGrpcCertificateWorkloadIdentity(certificate.subjectAltName, config.workloadSpiffeId)
  return ServerCredentials.createSsl(
    rootCerts,
    [{ cert_chain: certChain, private_key: privateKey }],
    true
  )
}

/** Builds grpc-js client credentials for the current workload's exact certificate binding. */
export function createGrpcClientCredentials(
  environment: NodeJS.ProcessEnv = process.env,
  expectedPeerSpiffeId?: string
): ChannelCredentials {
  const config = readGrpcTlsConfig(environment)
  const rootCerts = readFileSync(config.caPath)
  const certChain = readFileSync(config.certPath)
  const privateKey = readFileSync(config.keyPath)
  const certificate = new X509Certificate(certChain)
  assertGrpcCertificateWorkloadIdentity(certificate.subjectAltName, config.workloadSpiffeId)
  return ChannelCredentials.createSsl(
    rootCerts,
    privateKey,
    certChain,
    expectedPeerSpiffeId
      ? {
          checkServerIdentity: (_hostname: string, peer: PeerCertificate) =>
            serverIdentityError(peer.subjectaltname, expectedPeerSpiffeId)
        }
      : undefined
  )
}

/** Derives the current workload identity and leaf thumbprint from the deployment certificate files. */
export function readLocalVerifiedWorkloadIdentity(
  environment: NodeJS.ProcessEnv = process.env
): VerifiedWorkloadIdentity {
  const config = readGrpcTlsConfig(environment)
  const certificate = new X509Certificate(readFileSync(config.certPath))
  assertGrpcCertificateWorkloadIdentity(certificate.subjectAltName, config.workloadSpiffeId)
  return Object.freeze({
    spiffeId: config.workloadSpiffeId,
    certificateThumbprint: createHash('sha256').update(certificate.raw).digest('base64url')
  })
}

/** Requires the configured certificate to carry exactly the configured workload SPIFFE URI. */
export function assertGrpcCertificateWorkloadIdentity(
  subjectAltName: string | undefined,
  workloadSpiffeId: string
): void {
  if (readSpiffeId(subjectAltName) !== workloadSpiffeId) {
    throw new Error('gRPC TLS certificate SPIFFE identity does not match OES_WORKLOAD_SPIFFE_ID')
  }
}

/** Extracts the first URI SAN SPIFFE identity from certificate data released by grpc-js after TLS validation. */
export function readSpiffeId(subjectAltName: string | undefined): string | undefined {
  return subjectAltName?.match(/(?:^|,\s*)URI:(spiffe:\/\/[^,\s]+)/)?.[1]
}

/** Rejects a TLS-authenticated server whose SPIFFE URI is not the exact configured workload target. */
function serverIdentityError(
  subjectAltName: string | undefined,
  expectedPeerSpiffeId: string
): Error | undefined {
  if (!expectedPeerSpiffeId.startsWith('spiffe://')) {
    return new Error('gRPC target workload SPIFFE identity is invalid')
  }
  return readSpiffeId(subjectAltName) === expectedPeerSpiffeId
    ? undefined
    : new Error('gRPC TLS server SPIFFE identity does not match the expected workload')
}

function requireValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
