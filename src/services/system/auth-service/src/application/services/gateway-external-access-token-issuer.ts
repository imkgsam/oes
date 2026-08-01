import { randomUUID } from 'node:crypto'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'

/** Issues a distinct protected Gateway-only external token profile, never an internal ExecutionToken. */
export class GatewayExternalAccessTokenIssuer {
  constructor(private readonly issuer: string, private readonly signer: ExecutionTokenSigningPort, private readonly now = () => Math.floor(Date.now() / 1000)) {}
  async issue(input: { machineId: string; tenantId: string; credentialId: string; scope: readonly string[]; authzVersion: string }) {
    const scope = [...new Set(input.scope)].sort()
    if (!input.machineId || !input.tenantId || !input.credentialId || !input.authzVersion || scope.length === 0) throw new Error('EXTERNAL_CAPABILITY_NOT_ALLOWED')
    const auditCorrelationId = randomUUID()
    const key = await this.signer.currentSigningKey(); const iat = this.now(); const exp = iat + 300
    const head = Buffer.from(JSON.stringify({ alg: 'ES256', kid: key.kid, typ: 'oes-external+jwt' })).toString('base64url')
    const body = Buffer.from(JSON.stringify({ iss: this.issuer, aud: 'api-gateway', sub: input.machineId, tenant_id: input.tenantId, credential_id: input.credentialId, scope: scope.join(' '), authz_version: input.authzVersion, jti: randomUUID(), iat, nbf: iat, exp })).toString('base64url')
    const signed = `${head}.${body}`; const token = `${signed}.${Buffer.from(await this.signer.sign(key.kid, Buffer.from(signed))).toString('base64url')}`
    if (Buffer.byteLength(token) > 4096) throw new Error('EXTERNAL_AUTHORIZATION_SNAPSHOT_TOO_LARGE')
    return { accessToken: token, tokenType: 'Bearer', expiresAtUnixSeconds: String(exp), expiresInSeconds: '300', credentialId: input.credentialId, integrationMachineId: input.machineId, tenantId: input.tenantId, auditCorrelationId }
  }
}
