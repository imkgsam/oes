import { ServerCredentials } from '@grpc/grpc-js'
import { readFileSync } from 'node:fs'
import { X509Certificate } from 'node:crypto'
import type { GrpcVerifiedPeerAdapter, TransportVerifiedGrpcPeer } from '@oes/common/transport'

export type AuthGrpcTlsConfig = Readonly<{
  caPath: string
  certPath: string
  keyPath: string
  workloadSpiffeId: string
}>

type GrpcAuthenticatedCall = {
  getAuthContext?: () => {
    transportSecurityType?: string
    sslPeerCertificate?: { raw?: Buffer; subjectaltname?: string }
  }
}

/** Adapts only grpc-js mTLS-authenticated peer certificate facts into Common's verified transport interface. */
export class AuthGrpcVerifiedPeerAdapter implements GrpcVerifiedPeerAdapter<GrpcAuthenticatedCall> {
  /** Resolves a SPIFFE URI and certificate DER only when grpc-js reports an SSL peer certificate. */
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
    )
      return undefined
    return Object.freeze({ transportVerified: true, spiffeId, certificateDer: certificate.raw })
  }
}

/** Reads the frozen Auth mTLS deployment bindings and rejects any plaintext or incomplete listener configuration. */
export function readAuthGrpcTlsConfig(
  environment: NodeJS.ProcessEnv = process.env
): AuthGrpcTlsConfig {
  if (environment.OES_GRPC_TLS_ENABLED !== 'true') throw new Error('Auth gRPC mTLS is required')
  if (environment.OES_GRPC_TLS_MIN_VERSION !== 'TLSv1.2')
    throw new Error('Auth gRPC TLSv1.2 is required')
  const caPath = requireValue(environment, 'OES_GRPC_TLS_CA_PATH')
  const certPath = requireValue(environment, 'OES_GRPC_TLS_CERT_PATH')
  const keyPath = requireValue(environment, 'OES_GRPC_TLS_KEY_PATH')
  const workloadSpiffeId = requireValue(environment, 'OES_WORKLOAD_SPIFFE_ID')
  if (!workloadSpiffeId.startsWith('spiffe://'))
    throw new Error('OES_WORKLOAD_SPIFFE_ID must be a SPIFFE URI')
  return Object.freeze({ caPath, certPath, keyPath, workloadSpiffeId })
}

/** Builds the grpc-js server credentials with CA trust and mandatory client certificate validation. */
export function createAuthGrpcServerCredentials(
  environment: NodeJS.ProcessEnv = process.env
): ServerCredentials {
  const config = readAuthGrpcTlsConfig(environment)
  const rootCerts = readFileSync(config.caPath)
  const certChain = readFileSync(config.certPath)
  const privateKey = readFileSync(config.keyPath)
  const certificate = new X509Certificate(certChain)
  assertAuthCertificateWorkloadIdentity(certificate.subjectAltName, config.workloadSpiffeId)
  return ServerCredentials.createSsl(
    rootCerts,
    [{ cert_chain: certChain, private_key: privateKey }],
    true
  )
}

/** Requires the listener certificate to carry exactly the configured Auth workload SPIFFE URI. */
export function assertAuthCertificateWorkloadIdentity(
  subjectAltName: string | undefined,
  workloadSpiffeId: string
): void {
  if (readSpiffeId(subjectAltName) !== workloadSpiffeId) {
    throw new Error('Auth TLS certificate SPIFFE identity does not match OES_WORKLOAD_SPIFFE_ID')
  }
}

/** Extracts the first URI SAN SPIFFE identity from certificate data released by grpc-js after TLS validation. */
function readSpiffeId(subjectAltName: string | undefined): string | undefined {
  return subjectAltName?.match(/(?:^|,\s*)URI:(spiffe:\/\/[^,\s]+)/)?.[1]
}

/** Reads one mandatory deployment string without accepting whitespace or hidden fallback values. */
function requireValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
