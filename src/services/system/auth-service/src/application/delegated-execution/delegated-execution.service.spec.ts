import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { actionDescriptorDigest, type ActionDescriptorV1 } from '@oes/common/authorization'
import { DelegatedExecutionService } from './delegated-execution.service'
import type {
  DelegatedAuthorizationPort,
  DelegationGrantRepository,
  DelegationGrantSnapshot,
  DelegatedExecutionAuditInput
} from './delegated-execution.ports'
import type {
  ExecutionTokenSigningKey,
  ExecutionTokenSigningPort
} from '../../domain/ports/execution-token-signing.port'

const NOW = 1_700_000_000
const TOOL = { id: 'oes.ai.task-assistant.collaboration-task', version: '1.0.0' }
const descriptor: ActionDescriptorV1 = {
  descriptorVersion: 'v1',
  operationKey: 'collaboration.task.create-assigned.v1',
  toolContract: TOOL,
  target: { tenantId: 'tenant-1', assigneeAccountId: 'account-2' },
  input: { title: 'Prepare report', description: null, dueAt: null, priority: 'NORMAL' },
  idempotencyKey: 'idem-1'
}

/** Stores delegation and lifecycle audit facts in memory for application-level behavior tests. */
class MemoryRepository implements DelegationGrantRepository {
  readonly grants = new Map<string, DelegationGrantSnapshot>()
  readonly audits: DelegatedExecutionAuditInput[] = []

  async create(grant: DelegationGrantSnapshot, audit: DelegatedExecutionAuditInput): Promise<void> {
    this.grants.set(grant.delegationReference, grant)
    this.audits.push(audit)
  }

  async find(reference: string): Promise<DelegationGrantSnapshot | undefined> {
    return this.grants.get(reference)
  }

  async revoke(
    reference: string,
    revokedAt: Date,
    audit: DelegatedExecutionAuditInput
  ): Promise<DelegationGrantSnapshot> {
    const current = this.grants.get(reference)!
    const revoked = { ...current, revokedAt }
    this.grants.set(reference, revoked)
    this.audits.push(audit)
    return revoked
  }

  async appendAudit(audit: DelegatedExecutionAuditInput): Promise<void> {
    this.audits.push(audit)
  }
}

/** Produces real P-256 signatures while preserving the non-exporting signer port shape. */
class FakeSigner implements ExecutionTokenSigningPort {
  readonly pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  readonly key: ExecutionTokenSigningKey = {
    kid: 'kid-1',
    publicJwk: this.pair.publicKey.export({ format: 'jwk' }),
    publishNotBeforeUnixSeconds: NOW - 600,
    signingNotBeforeUnixSeconds: NOW - 300,
    retireAfterUnixSeconds: NOW + 600
  }
  async currentSigningKey() {
    return this.key
  }
  async publishedKeys() {
    return [this.key]
  }
  async sign(kid: string, input: Uint8Array) {
    if (kid !== this.key.kid) throw new Error('unexpected kid')
    return sign('sha256', input, { key: this.pair.privateKey, dsaEncoding: 'ieee-p1363' })
  }
}

/** Creates the Auth application service with explicit authorization and persistence boundaries. */
function fixture(overrides: Partial<DelegatedAuthorizationPort> = {}) {
  const repository = new MemoryRepository()
  const signer = new FakeSigner()
  const authorization: DelegatedAuthorizationPort = {
    authorizeDelegation: jest.fn().mockResolvedValue({
      allowed: true,
      decisionReference: 'decision-create',
      authzVersion: 'v1'
    }),
    authorizeAction: jest.fn().mockResolvedValue({
      allowed: true,
      riskClass: 'ACTION_GRANT_REQUIRED',
      decisionReference: 'decision-action',
      authzVersion: 'v1',
      stepUpRequired: false
    }),
    ...overrides
  }
  return {
    repository,
    signer,
    authorization,
    service: new DelegatedExecutionService({
      repository,
      authorization,
      confirmationEvidence: {
        verify: jest.fn().mockResolvedValue({ matched: true, reference: 'confirmation-1' })
      },
      signer,
      issuer: 'https://auth.local.oes.example',
      now: () => NOW,
      randomId: (() => {
        let value = 0
        return () => `id-${++value}`
      })()
    })
  }
}

const createInput = {
  humanPrincipalId: 'human-1',
  sessionId: 'session-1',
  tenantId: 'tenant-1',
  agentPrincipalId: 'agent-1',
  toolContract: TOOL,
  operationKeys: ['collaboration.task.create-assigned.v1'],
  permissionCodes: ['collaboration.task.assign'],
  expiresAt: new Date((NOW + 3_600) * 1_000),
  traceId: 'trace-1'
}

describe('DelegatedExecutionService', () => {
  it('creates a self-only delegation without inventing a Permission Code', async () => {
    const { service, authorization } = fixture()

    await expect(
      service.createDelegationGrant({
        ...createInput,
        operationKeys: ['collaboration.task.create-self.v1'],
        permissionCodes: []
      })
    ).resolves.toMatchObject({
      operationKeys: ['collaboration.task.create-self.v1'],
      permissionCodes: []
    })
    expect(authorization.authorizeDelegation).toHaveBeenCalledWith(
      expect.objectContaining({ permissionCodes: [] })
    )
  })

  it('fails closed when Permission denies the requested delegation upper bound', async () => {
    const { service, repository } = fixture({
      authorizeDelegation: jest
        .fn()
        .mockResolvedValue({ allowed: false, decisionReference: 'deny', authzVersion: 'v2' })
    })
    await expect(service.createDelegationGrant(createInput)).rejects.toThrow(
      'DELEGATION_TOOL_BOUNDARY_DENIED'
    )
    expect(repository.grants.size).toBe(0)
  })

  it('revokes idempotently and prevents all later ActionGrant issuance', async () => {
    const { service } = fixture()
    const created = await service.createDelegationGrant(createInput)
    const first = await service.revokeDelegationGrant({
      delegationReference: created.delegationReference,
      humanPrincipalId: 'human-1',
      reasonCategory: 'USER_REVOKED',
      traceId: 'trace-2'
    })
    const second = await service.revokeDelegationGrant({
      delegationReference: created.delegationReference,
      humanPrincipalId: 'human-1',
      reasonCategory: 'USER_REVOKED',
      traceId: 'trace-3'
    })
    expect(second.revokedAt).toEqual(first.revokedAt)
    await expect(
      service.requestActionGrant({
        delegationReference: created.delegationReference,
        humanPrincipalId: 'human-1',
        agentPrincipalId: 'agent-1',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:collaboration-service',
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/ai-platform',
          certificateThumbprint: 'A'.repeat(43)
        },
        descriptor,
        confirmation: {
          reference: 'confirmation-1',
          descriptorDigest: actionDescriptorDigest(descriptor)
        },
        traceId: 'trace-4'
      })
    ).rejects.toThrow('DELEGATION_GRANT_REVOKED')
  })

  it('issues one short-lived ag+jwt through the existing protected ES256 signer boundary', async () => {
    const { service, signer, repository } = fixture()
    const created = await service.createDelegationGrant(createInput)
    const result = await service.requestActionGrant({
      delegationReference: created.delegationReference,
      humanPrincipalId: 'human-1',
      agentPrincipalId: 'agent-1',
      tenantId: 'tenant-1',
      targetAudience: 'urn:oes:service:collaboration-service',
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes/ai-platform',
        certificateThumbprint: 'A'.repeat(43)
      },
      descriptor,
      confirmation: {
        reference: 'confirmation-1',
        descriptorDigest: actionDescriptorDigest(descriptor)
      },
      traceId: 'trace-2'
    })
    const [header, claims, signature] = result.actionGrant.split('.')
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({
      alg: 'ES256',
      kid: 'kid-1',
      typ: 'ag+jwt'
    })
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
      aud: 'urn:oes:service:collaboration-service',
      sub: 'human-1',
      agent_id: 'agent-1',
      tool_contract_id: TOOL.id,
      tool_contract_version: TOOL.version,
      descriptor_digest: actionDescriptorDigest(descriptor),
      cnf: { 'x5t#S256': 'A'.repeat(43) },
      exp: NOW + 120
    })
    expect(
      verify(
        'sha256',
        Buffer.from(`${header}.${claims}`),
        {
          key: signer.pair.publicKey,
          dsaEncoding: 'ieee-p1363'
        },
        Buffer.from(signature, 'base64url')
      )
    ).toBe(true)
    expect(repository.audits.at(-1)).toMatchObject({
      eventType: 'ACTION_GRANT_ISSUED',
      result: 'SUCCEEDED'
    })
  })

  it('rejects confirmation or ToolContract drift before signing', async () => {
    const { service, signer } = fixture()
    const created = await service.createDelegationGrant(createInput)
    const signSpy = jest.spyOn(signer, 'sign')
    await expect(
      service.requestActionGrant({
        delegationReference: created.delegationReference,
        humanPrincipalId: 'human-1',
        agentPrincipalId: 'agent-1',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:collaboration-service',
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/ai-platform',
          certificateThumbprint: 'A'.repeat(43)
        },
        descriptor: { ...descriptor, toolContract: { ...TOOL, version: '2.0.0' } },
        confirmation: {
          reference: 'confirmation-1',
          descriptorDigest: actionDescriptorDigest(descriptor)
        },
        traceId: 'trace-2'
      })
    ).rejects.toThrow('ACTION_GRANT_DESCRIPTOR_MISMATCH')
    expect(signSpy).not.toHaveBeenCalled()
  })

  it('requires owner-verified confirmation evidence instead of trusting a caller reference', async () => {
    const { repository, signer, authorization } = fixture()
    const service = new DelegatedExecutionService({
      repository,
      signer,
      authorization,
      confirmationEvidence: {
        verify: jest.fn().mockResolvedValue({ matched: false, reference: 'confirmation-1' })
      },
      issuer: 'https://auth.local.oes.example',
      now: () => NOW,
      randomId: () => 'id-confirmation'
    })
    const created = await service.createDelegationGrant(createInput)
    await expect(
      service.requestActionGrant({
        delegationReference: created.delegationReference,
        humanPrincipalId: 'human-1',
        agentPrincipalId: 'agent-1',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:collaboration-service',
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/ai-platform',
          certificateThumbprint: 'A'.repeat(43)
        },
        descriptor,
        confirmation: {
          reference: 'confirmation-1',
          descriptorDigest: actionDescriptorDigest(descriptor)
        },
        traceId: 'trace-2'
      })
    ).rejects.toThrow('ACTION_GRANT_CONFIRMATION_REQUIRED')
  })

  it('fails closed when the shared DG-1 signing key is not currently eligible', async () => {
    const { service, signer } = fixture()
    const created = await service.createDelegationGrant(createInput)
    ;(signer.key as { retireAfterUnixSeconds: number }).retireAfterUnixSeconds = NOW
    await expect(
      service.requestActionGrant({
        delegationReference: created.delegationReference,
        humanPrincipalId: 'human-1',
        agentPrincipalId: 'agent-1',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:collaboration-service',
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/ai-platform',
          certificateThumbprint: 'A'.repeat(43)
        },
        descriptor,
        confirmation: {
          reference: 'confirmation-1',
          descriptorDigest: actionDescriptorDigest(descriptor)
        },
        traceId: 'trace-2'
      })
    ).rejects.toThrow('ACTION_GRANT_SIGNING_KEY_INELIGIBLE')
  })

  it('rejects ActionGrant issuance when the current authorization version drifted', async () => {
    const { service, signer } = fixture({
      authorizeAction: jest.fn().mockResolvedValue({
        allowed: true,
        riskClass: 'ACTION_GRANT_REQUIRED',
        decisionReference: 'decision-action-v2',
        authzVersion: 'v2',
        stepUpRequired: false
      })
    })
    const created = await service.createDelegationGrant(createInput)
    const signSpy = jest.spyOn(signer, 'sign')

    await expect(
      service.requestActionGrant({
        delegationReference: created.delegationReference,
        humanPrincipalId: 'human-1',
        agentPrincipalId: 'agent-1',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:collaboration-service',
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/ai-platform',
          certificateThumbprint: 'A'.repeat(43)
        },
        descriptor,
        confirmation: {
          reference: 'confirmation-1',
          descriptorDigest: actionDescriptorDigest(descriptor)
        },
        traceId: 'trace-2'
      })
    ).rejects.toThrow('DELEGATION_TOOL_BOUNDARY_DENIED')
    expect(signSpy).not.toHaveBeenCalled()
  })
})
