import { createPublicKey, verify } from 'node:crypto'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'
import { IIdentityServicePort } from '../../application/ports/identity-service.port'
import { requireHumanOboSubjectScope } from '../../domain/services/human-obo-subject-scope'
import { requireTrustedSessionTerminal } from '@oes/common/authorization'
import type {
  TrustedExecutionContext,
  VerifiedExecutionWorkload
} from '../../application/services/execution-token-exchange.service'

/** Re-verifies one current-service HUMAN subject ET and resolves its SYSTEM actor from registry-owned selectors. */
export class ExecutionTokenSubjectCredentialVerifier {
  constructor(
    private readonly signer: ExecutionTokenSigningPort,
    private readonly identity: IIdentityServicePort,
    private readonly registry: ExecutionTokenRegistry,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000)
  ) {}

  async verify(
    token: string,
    workload: VerifiedExecutionWorkload,
    targetAudience: string,
    correlation?: { requestId?: string; traceparent?: string; tracestate?: string }
  ): Promise<TrustedExecutionContext> {
    const trustedCorrelation = requireCorrelation(correlation)
    const [headerPart, claimsPart, signaturePart, extra] = token.split('.')
    if (!headerPart || !claimsPart || !signaturePart || extra) throw invalid()
    const header = decode(headerPart),
      claims = decode(claimsPart)
    if (
      header.typ !== 'at+jwt' ||
      header.alg !== 'ES256' ||
      typeof header.kid !== 'string' ||
      Object.keys(header).sort().join('|') !== 'alg|kid|typ'
    )
      throw invalid()
    const key = (await this.signer.publishedKeys()).find((item) => item.kid === header.kid)
    if (
      !key ||
      !verify(
        'sha256',
        Buffer.from(`${headerPart}.${claimsPart}`),
        { key: createPublicKey({ key: key.publicJwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' },
        Buffer.from(signaturePart, 'base64url')
      )
    )
      throw invalid()
    const now = this.now()
    if (
      claims.iss !== this.registry.issuer ||
      claims.principal_type !== 'HUMAN' ||
      typeof claims.aud !== 'string' ||
      typeof claims.sub !== 'string' ||
      !exact(claims.sub) ||
      typeof claims.session_id !== 'string' ||
      !exact(claims.session_id) ||
      typeof claims.jti !== 'string' ||
      !exact(claims.jti) ||
      !Number.isInteger(claims.iat) ||
      !Number.isInteger(claims.nbf) ||
      !Number.isInteger(claims.exp) ||
      (claims.nbf as number) < (claims.iat as number) ||
      (claims.iat as number) > now ||
      (claims.nbf as number) > now ||
      (claims.exp as number) <= now ||
      (claims.exp as number) <= (claims.iat as number) ||
      (claims.exp as number) - (claims.iat as number) > 300 ||
      claims.act !== undefined ||
      (claims.org_id !== undefined && !exact(claims.org_id)) ||
      typeof claims.session_terminal !== 'string'
    )
      throw invalid()
    let sessionTerminal
    let authzVersion
    let subjectScope
    try {
      sessionTerminal = requireTrustedSessionTerminal(claims.session_terminal)
      authzVersion = optionalAuthzVersion(claims.authz_version)
      subjectScope = requireHumanOboSubjectScope(
        claims.tenant_id === undefined ? 'SYSTEM' : 'TENANT',
        claims.tenant_id
      )
    } catch {
      throw invalid()
    }
    const selector = this.registry.resolveHumanOboActor(
      workload.spiffeId,
      claims.aud,
      targetAudience
    )
    const decision = await this.identity.resolveMachinePrincipalForAuth({
      machinePrincipalId: selector.actorMachinePrincipalId,
      bindingId: selector.actorBindingId,
      bindingVersion: BigInt(selector.actorBindingVersion),
      workloadSpiffeId: workload.spiffeId,
      requestId: trustedCorrelation.requestId,
      traceparent: trustedCorrelation.traceparent,
      tracestate: trustedCorrelation.tracestate
    })
    if (
      !decision.allowed ||
      decision.principalId !== selector.actorMachinePrincipalId ||
      decision.principalType !== 'MACHINE' ||
      decision.principalLifecycleStatus !== 'ACTIVE' ||
      decision.bindingId !== selector.actorBindingId ||
      decision.bindingVersion !== BigInt(selector.actorBindingVersion) ||
      decision.bindingStatus !== 'ACTIVE' ||
      decision.workloadSpiffeId !== workload.spiffeId ||
      decision.scopeLevel !== 'SYSTEM' ||
      decision.tenantId
    ) {
      throw new Error('EXECUTION_HUMAN_OBO_ACTOR_INVALID')
    }
    return Object.freeze({
      subject: claims.sub,
      principalType: 'HUMAN',
      scopeLevel: subjectScope.subjectScope,
      ...(subjectScope.optionalTenantId === undefined
        ? {}
        : { tenantId: subjectScope.optionalTenantId }),
      ...(typeof claims.org_id === 'string' ? { orgId: claims.org_id } : {}),
      sessionId: claims.session_id,
      sessionTerminal,
      ...(authzVersion === undefined ? {} : { authzVersion }),
      actor: Object.freeze({
        sub: selector.actorMachinePrincipalId,
        principal_type: 'MACHINE',
        scope_level: 'SYSTEM'
      }),
      sourceTokenId: claims.jti,
      sourceExpiresAt: claims.exp as number,
      requestId: trustedCorrelation.requestId,
      traceId: trustedCorrelation.traceId,
      spanId: trustedCorrelation.spanId
    })
  }
}

/** Decodes one compact-JWS segment without accepting malformed JSON as subject authority. */
function decode(value: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  } catch {
    throw invalid()
  }
}
/** Returns the stable failure category used for every invalid signed subject fact. */
function invalid(): Error {
  return new Error('EXECUTION_HUMAN_OBO_SUBJECT_INVALID')
}

/** Accepts only trimmed non-empty strings for authority-bearing subject claims. */
function exact(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim() === value
}

/** Preserves only the signed security-version shapes accepted by every ExecutionToken verifier. */
function optionalAuthzVersion(value: unknown): string | number | undefined {
  if (value === undefined) return undefined
  if (exact(value)) return value
  if (typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value)) return value
  throw invalid()
}

/** Requires request and W3C trace correlation before OBO actor or Permission resolution. */
function requireCorrelation(correlation?: {
  requestId?: string
  traceparent?: string
  tracestate?: string
}): Readonly<{
  requestId: string
  traceparent: string
  tracestate?: string
  traceId: string
  spanId: string
}> {
  const traceparent = correlation?.traceparent
  const match =
    typeof traceparent === 'string'
      ? /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i.exec(traceparent)
      : null
  if (
    !exact(correlation?.requestId) ||
    match === null ||
    /^0{32}$/.test(match[1]) ||
    /^0{16}$/.test(match[2]) ||
    (correlation?.tracestate !== undefined && !exact(correlation.tracestate))
  ) {
    throw new Error('EXECUTION_HUMAN_OBO_CORRELATION_REQUIRED')
  }
  return Object.freeze({
    requestId: correlation.requestId,
    traceparent: traceparent.toLowerCase(),
    ...(correlation.tracestate === undefined ? {} : { tracestate: correlation.tracestate }),
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase()
  })
}
