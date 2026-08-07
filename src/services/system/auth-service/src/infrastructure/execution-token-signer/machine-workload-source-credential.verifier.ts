import { createPublicKey, verify } from 'node:crypto'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { MachineWorkloadSourceCredentialRepository } from '../../domain/repositories/machine-workload-source-credential.repository'
import { VerifiedExecutionWorkload, TrustedExecutionContext } from '../../application/services/execution-token-exchange.service'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'

/** Strictly validates only the dedicated Auth MACHINE source JWS profile against live Auth lifecycle state and mTLS facts. */
export class MachineWorkloadSourceCredentialVerifier {
  constructor(private readonly repository: MachineWorkloadSourceCredentialRepository, private readonly signer: ExecutionTokenSigningPort, private readonly identity: IIdentityServicePort, private readonly issuer: string, private readonly now: () => number = () => Math.floor(Date.now() / 1_000)) {}

  async verify(sourceCredential: string, workload: VerifiedExecutionWorkload): Promise<TrustedExecutionContext> {
    const [headerPart, claimsPart, signaturePart, extra] = sourceCredential.split('.')
    if (!headerPart || !claimsPart || !signaturePart || extra) throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
    const header = decode(headerPart)
    const claims = decode(claimsPart)
    const exp = claims.exp
    const iat = claims.iat
    const nbf = claims.nbf
    const cnf = claims.cnf as Record<string, unknown> | undefined
    if (header.typ !== 'oes-machine-source+jwt' || header.alg !== 'ES256' || typeof header.kid !== 'string' || claims.iss !== this.issuer || claims.aud !== 'urn:oes:service:auth-service' || claims.profile_version !== 1 || typeof claims.jti !== 'string' || typeof claims.sub !== 'string' || typeof claims.client_id !== 'string' || claims.client_id !== workload.spiffeId || cnf?.['x5t#S256'] !== workload.certificateThumbprint || typeof iat !== 'number' || typeof nbf !== 'number' || typeof exp !== 'number' || nbf > this.now() || exp - iat > 900 || exp <= this.now()) throw new Error(typeof exp === 'number' && exp <= this.now() ? 'EXECUTION_MACHINE_SOURCE_CREDENTIAL_EXPIRED' : 'EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
    const key = (await this.signer.publishedKeys()).find((candidate) => candidate.kid === header.kid)
    if (!key || !verify('sha256', Buffer.from(`${headerPart}.${claimsPart}`), { key: createPublicKey({ key: key.publicJwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, Buffer.from(signaturePart, 'base64url'))) throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
    const credential = await this.repository.findById(claims.jti)
    if (!credential || credential.status === 'REVOKED') throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_REVOKED')
    if (credential.status !== 'ACTIVE' || credential.signingKid !== header.kid || credential.profileVersion !== 1 || Math.floor(credential.expiresAt.getTime() / 1_000) !== exp || credential.machinePrincipalId !== claims.sub || credential.machineWorkloadBindingId !== claims.machine_workload_binding_id || credential.machineWorkloadBindingVersion.toString() !== String(claims.machine_workload_binding_version) || credential.workloadSpiffeId !== workload.spiffeId || credential.certificateThumbprint !== workload.certificateThumbprint) throw new Error('EXECUTION_MACHINE_WORKLOAD_BINDING_MISMATCH')
    const decision = await this.identity.resolveMachinePrincipalForAuth({ machinePrincipalId: credential.machinePrincipalId, bindingId: credential.machineWorkloadBindingId, bindingVersion: credential.machineWorkloadBindingVersion, workloadSpiffeId: workload.spiffeId })
    if (!decision.allowed || !decision.scopeLevel) throw new Error('EXECUTION_MACHINE_BINDING_STALE')
    return Object.freeze({ subject: credential.machinePrincipalId, principalType: 'MACHINE', scopeLevel: decision.scopeLevel, ...(decision.tenantId ? { tenantId: decision.tenantId } : {}), ...(decision.orgId ? { orgId: decision.orgId } : {}) })
  }
}

/** Decodes compact-JWS JSON segments only after their structural presence was checked. */
function decode(value: string): Record<string, unknown> { try { return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, unknown> } catch { throw new Error('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID') } }
