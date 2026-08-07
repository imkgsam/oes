import { randomUUID } from 'node:crypto'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { MachineWorkloadSourceCredentialRepository } from '../../domain/repositories/machine-workload-source-credential.repository'
import { MachineWorkloadSourceCredentialEntity } from '../../domain/entities/machine-workload-source-credential.entity'

type WorkloadIdentity = { spiffeId: string; certificateThumbprint: string; certificateNotAfter: Date }
type IdentityResolver = {
  resolveMachinePrincipalForAuth(input: {
    machinePrincipalId: string
    bindingId: string
    bindingVersion: bigint
    workloadSpiffeId: string
  }): Promise<{ allowed: boolean; reasonCode?: string }>
}

/** Issues only short-lived certificate-bound source credentials after Identity proves the exact workload binding. */
export class MachineWorkloadSourceCredentialService {
  static readonly MAX_TTL_SECONDS = 15 * 60

  constructor(
    private readonly identity: IdentityResolver,
    private readonly repository: MachineWorkloadSourceCredentialRepository,
    private readonly signer: ExecutionTokenSigningPort,
    private readonly issuer: string,
    private readonly now: () => number = () => Math.floor(Date.now() / 1_000)
  ) {}

  async issue(input: {
    machinePrincipalId: string
    bindingId: string
    bindingVersion: bigint
    workloadIdentity: WorkloadIdentity
  }): Promise<{ sourceCredential: string; credential: MachineWorkloadSourceCredentialEntity; supersedesCredentialId: string }> {
    const decision = await this.identity.resolveMachinePrincipalForAuth({
      machinePrincipalId: input.machinePrincipalId,
      bindingId: input.bindingId,
      bindingVersion: input.bindingVersion,
      workloadSpiffeId: input.workloadIdentity.spiffeId
    })
    if (!decision.allowed) throw new Error(mapIdentityReason(decision.reasonCode))
    const issuedAt = this.now()
    const certificateExpiry = Math.floor(input.workloadIdentity.certificateNotAfter.getTime() / 1_000)
    const expiresAt = Math.min(issuedAt + MachineWorkloadSourceCredentialService.MAX_TTL_SECONDS, certificateExpiry)
    if (expiresAt <= issuedAt || !isThumbprint(input.workloadIdentity.certificateThumbprint)) {
      throw new Error('EXECUTION_MACHINE_CERTIFICATE_BINDING_MISMATCH')
    }
    const key = await this.signer.currentSigningKey()
    const id = randomUUID()
    const header = encode({ alg: 'ES256', typ: 'oes-machine-source+jwt', kid: key.kid })
    const claims = encode({ iss: this.issuer, aud: 'urn:oes:service:auth-service', sub: input.machinePrincipalId, jti: id, iat: issuedAt, nbf: issuedAt, exp: expiresAt, client_id: input.workloadIdentity.spiffeId, cnf: { 'x5t#S256': input.workloadIdentity.certificateThumbprint }, machine_workload_binding_id: input.bindingId, machine_workload_binding_version: input.bindingVersion.toString(), profile_version: 1 })
    const signingInput = `${header}.${claims}`
    const signature = await this.signer.sign(key.kid, Buffer.from(signingInput, 'utf8'))
    const sourceCredential = `${signingInput}.${Buffer.from(signature).toString('base64url')}`
    const credential = await this.repository.issue({ id, machinePrincipalId: input.machinePrincipalId, machineWorkloadBindingId: input.bindingId, machineWorkloadBindingVersion: input.bindingVersion, workloadSpiffeId: input.workloadIdentity.spiffeId, certificateThumbprint: input.workloadIdentity.certificateThumbprint, certificateNotAfter: input.workloadIdentity.certificateNotAfter, signingKid: key.kid, issuedAt: new Date(issuedAt * 1_000), expiresAt: new Date(expiresAt * 1_000), auditId: `machine-source-issue:${id}`, traceId: null })
    return { sourceCredential, credential, supersedesCredentialId: credential.predecessorId ?? '' }
  }

  /** Delegates idempotent revocation to the transactional Auth-local lifecycle repository. */
  async revoke(input: { credentialId: string; reasonCode: string; operatorId?: string }) {
    return this.repository.revoke(input)
  }
}

/** Maps non-enumerating Identity reasons to Auth's stable pre-signing error categories. */
function mapIdentityReason(reason?: string): string {
  if (reason === 'MACHINE_WORKLOAD_BINDING_STALE') return 'EXECUTION_MACHINE_BINDING_STALE'
  if (reason === 'MACHINE_WORKLOAD_SPIFFE_MISMATCH') return 'EXECUTION_MACHINE_WORKLOAD_BINDING_MISMATCH'
  if (reason === 'MACHINE_PRINCIPAL_SCOPE_INVALID') return 'EXECUTION_MACHINE_SCOPE_MISMATCH'
  return 'EXECUTION_MACHINE_PRINCIPAL_INACTIVE'
}

/** Serializes only Auth-controlled JWS header and claims fields. */
function encode(value: Record<string, unknown>): string { return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url') }
/** Validates the canonical SHA-256 x5t base64url encoding before a signing call. */
function isThumbprint(value: string): boolean { return /^[A-Za-z0-9_-]{43}$/.test(value) }
