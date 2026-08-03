import { generateKeyPairSync, sign } from 'node:crypto'
import { Metadata } from '@grpc/grpc-js'
import { ExecutionTokenJwksCache } from '../execution-token-jwks-cache'
import { TrustedExecutionRegistry } from '../trusted-execution-registry'
import {
  ActionDescriptorV1,
  ActionGrantVerifier,
  actionDescriptorDigest,
  actionValueDigest,
  extractActionGrantMetadata,
  createLazyActionGrantVerifier,
  setActionGrantMetadata
} from '.'

const NOW = 1_700_000_000
const AUDIENCE = 'urn:oes:service:collaboration-service'
const WORKLOAD = 'spiffe://local.oes/ai-platform'
const THUMBPRINT = 'A'.repeat(43)
const TOOL_ID = 'oes.ai.task-assistant.collaboration-task'

const descriptor: ActionDescriptorV1 = {
  descriptorVersion: 'v1',
  operationKey: 'collaboration.task.create-assigned.v1',
  toolContract: { id: TOOL_ID, version: '1.0.0' },
  target: { tenantId: 'tenant-1', assigneeAccountId: 'account-2' },
  input: {
    title: 'Prepare report',
    description: null,
    dueAt: null,
    priority: 'NORMAL'
  },
  idempotencyKey: 'idem-1'
}

/** Creates one real ES256 ActionGrant so verifier tests exercise signature and claim binding. */
function fixture(overrides: Record<string, unknown> = {}) {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const publicJwk = pair.publicKey.export({ format: 'jwk' })
  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid: 'kid-1', typ: 'ag+jwt' })
  ).toString('base64url')
  const claims = {
    iss: 'https://auth.local.oes.example',
    aud: AUDIENCE,
    sub: 'human-1',
    principal_type: 'DELEGATED',
    client_id: WORKLOAD,
    tenant_id: 'tenant-1',
    delegation_id: 'delegation-1',
    agent_id: 'agent-1',
    tool_contract_id: TOOL_ID,
    tool_contract_version: '1.0.0',
    operation_key: descriptor.operationKey,
    target_digest: actionValueDigest(descriptor.target),
    input_digest: actionValueDigest(descriptor.input),
    descriptor_digest: actionDescriptorDigest(descriptor),
    idempotency_key: descriptor.idempotencyKey,
    confirmation_ref: 'confirmation-1',
    authorization_decision_ref: 'decision-1',
    jti: 'action-grant-1',
    iat: NOW,
    nbf: NOW,
    exp: NOW + 120,
    cnf: { 'x5t#S256': THUMBPRINT },
    ...overrides
  }
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  const signingInput = `${header}.${payload}`
  const signature = sign('sha256', Buffer.from(signingInput), {
    key: pair.privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url')
  const registry = new TrustedExecutionRegistry({
    issuer: 'https://auth.local.oes.example',
    audiences: [AUDIENCE],
    workloadIdentities: [WORKLOAD]
  })
  const jwksCache = new ExecutionTokenJwksCache({
    load: async () => ({ keys: [{ ...publicJwk, alg: 'ES256', kid: 'kid-1', use: 'sig' }] }),
    maxAgeMs: 300_000,
    now: () => NOW * 1_000
  })
  return {
    token: `${signingInput}.${signature}`,
    verifier: new ActionGrantVerifier({ registry, jwksCache, now: () => NOW })
  }
}

describe('ActionDescriptorV1', () => {
  it('canonicalizes object keys while preserving nullness and array order', () => {
    const reordered = {
      ...descriptor,
      target: { assigneeAccountId: 'account-2', tenantId: 'tenant-1' },
      input: { priority: 'NORMAL', dueAt: null, description: null, title: 'Prepare report' }
    }
    expect(actionDescriptorDigest(reordered)).toBe(actionDescriptorDigest(descriptor))
    expect(
      actionDescriptorDigest({
        ...descriptor,
        input: { ...(descriptor.input as Record<string, string | null>), description: '' }
      })
    ).not.toBe(actionDescriptorDigest(descriptor))
  })

  it('rejects non-JSON and non-finite descriptor values', () => {
    expect(() => actionValueDigest({ value: undefined } as never)).toThrow('JSON-compatible')
    expect(() => actionValueDigest({ value: Number.NaN })).toThrow('finite')
    expect(() => actionValueDigest('\ud800')).toThrow('Unicode')
    expect(() => actionValueDigest(new Array(1) as never)).toThrow('sparse')
  })
})

describe('ActionGrantVerifier', () => {
  it('verifies the exact descriptor, delegated token, audience and workload binding', async () => {
    const { token, verifier } = fixture()
    await expect(
      verifier.verify({
        token,
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: WORKLOAD, certificateThumbprint: THUMBPRINT },
        executionToken: {
          issuer: 'https://auth.local.oes.example',
          audience: AUDIENCE,
          subject: 'agent-1',
          principalType: 'DELEGATED',
          clientId: WORKLOAD,
          tenantId: 'tenant-1',
          permissionCodes: ['collaboration.task.assign'],
          tokenId: 'et-1',
          issuedAt: NOW,
          notBefore: NOW,
          expiresAt: NOW + 300,
          certificateThumbprint: THUMBPRINT,
          actor: 'human-1',
          delegationId: 'delegation-1'
        },
        expectedDescriptor: descriptor
      })
    ).resolves.toMatchObject({
      actionGrantJti: 'action-grant-1',
      descriptorDigest: actionDescriptorDigest(descriptor)
    })
  })

  it.each([
    ['descriptor', { descriptor_digest: 'different' }],
    ['audience', { aud: 'urn:oes:service:other-service' }],
    ['workload', { client_id: 'spiffe://local.oes/other' }],
    ['expiry', { exp: NOW - 1 }]
  ])('fails closed on %s mismatch', async (_label, overrides) => {
    const { token, verifier } = fixture(overrides)
    await expect(
      verifier.verify({
        token,
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: WORKLOAD, certificateThumbprint: THUMBPRINT },
        executionToken: {
          issuer: 'https://auth.local.oes.example',
          audience: AUDIENCE,
          subject: 'agent-1',
          principalType: 'DELEGATED',
          clientId: WORKLOAD,
          tenantId: 'tenant-1',
          permissionCodes: [],
          tokenId: 'et-1',
          issuedAt: NOW,
          notBefore: NOW,
          expiresAt: NOW + 300,
          certificateThumbprint: THUMBPRINT,
          actor: 'human-1',
          delegationId: 'delegation-1'
        },
        expectedDescriptor: descriptor
      })
    ).rejects.toThrow()
  })

  it.each([
    [
      'assignee',
      { ...descriptor, target: { tenantId: 'tenant-1', assigneeAccountId: 'account-3' } }
    ],
    [
      'title',
      {
        ...descriptor,
        input: { ...(descriptor.input as Record<string, unknown>), title: 'Changed' }
      }
    ],
    [
      'description nullness',
      {
        ...descriptor,
        input: { ...(descriptor.input as Record<string, unknown>), description: '' }
      }
    ],
    [
      'due instant',
      {
        ...descriptor,
        input: {
          ...(descriptor.input as Record<string, unknown>),
          dueAt: '2026-08-04T00:00:00.000Z'
        }
      }
    ],
    [
      'priority',
      {
        ...descriptor,
        input: { ...(descriptor.input as Record<string, unknown>), priority: 'HIGH' }
      }
    ]
  ])('rejects a valid grant when Task %s changes', async (_label, expectedDescriptor) => {
    const { token, verifier } = fixture()
    await expect(
      verifier.verify({
        token,
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: WORKLOAD, certificateThumbprint: THUMBPRINT },
        executionToken: {
          issuer: 'https://auth.local.oes.example',
          audience: AUDIENCE,
          subject: 'agent-1',
          principalType: 'DELEGATED',
          clientId: WORKLOAD,
          tenantId: 'tenant-1',
          permissionCodes: ['collaboration.task.assign'],
          tokenId: 'et-1',
          issuedAt: NOW,
          notBefore: NOW,
          expiresAt: NOW + 300,
          certificateThumbprint: THUMBPRINT,
          actor: 'human-1',
          delegationId: 'delegation-1'
        },
        expectedDescriptor: expectedDescriptor as ActionDescriptorV1
      })
    ).rejects.toThrow('descriptor mismatch')
  })
})

describe('ActionGrant metadata', () => {
  it('accepts exactly one compact credential value', () => {
    const metadata = new Metadata()
    metadata.set('x-oes-action-grant', 'a.b.c')
    expect(extractActionGrantMetadata(metadata)).toBe('a.b.c')
    metadata.add('x-oes-action-grant', 'd.e.f')
    expect(() => extractActionGrantMetadata(metadata)).toThrow('exactly one')
  })

  it('sets one metadata-only credential and rejects overwrite', () => {
    const metadata = new Metadata()
    setActionGrantMetadata(metadata, 'a.b.c')
    expect(extractActionGrantMetadata(metadata)).toBe('a.b.c')
    expect(() => setActionGrantMetadata(metadata, 'd.e.f')).toThrow('already set')
  })
})

describe('lazy ActionGrant runtime', () => {
  it('fails closed on first use when deployment trust configuration is absent', async () => {
    const verifier = createLazyActionGrantVerifier(AUDIENCE, {})
    await expect(verifier.verify({} as never)).rejects.toThrow('AUTH_EXECUTION_ISSUER')
  })
})
