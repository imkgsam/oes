import {
  CLOUD_EVENTS_CONTENT_TYPE,
  DEFAULT_EVENT_BODY_LIMIT_BYTES,
  NatsJetStreamAdapter,
  createInboxIdentity,
  createDlqRecord,
  createSafeRedeliveryConsumerSpecs,
  recoverMaxDeliveryToDlq,
  createOesCloudEvent,
  decodeCloudEvent,
  encodeCloudEvent,
  runSafeRedelivery,
  toNatsPublishRequest,
  transferToDlqThenTerm,
  validateNatsTransport,
} from './index'

/** Verifies the public common event transport boundary against the frozen wire contract. */
describe('event platform CloudEvents codec', () => {
  const securityContract = {
    eventType: 'auth.execution-token.revoked',
    eventVersion: 1,
    ownerService: 'auth-service',
    transportProfile: 'SECURITY_CRITICAL' as const,
    validateData: (data: unknown): data is { value: string } =>
      typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string',
  }

  const input = {
    contract: {
      eventType: 'example.fact.happened',
      eventVersion: 1,
      ownerService: 'example-service',
      validateData: (data: unknown): data is { value: string } =>
        typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string',
    },
    eventId: 'evt-1',
    occurredAt: '2026-07-26T08:00:00.000Z',
    tenantId: 'tenant-1',
    aggregateType: 'EXAMPLE',
    aggregateId: 'aggregate-1',
    actorAccountId: 'account-1',
    traceId: 'trace-1',
    causationId: 'command-1',
    auditRef: 'audit-1',
    data: { value: 'frozen' },
  }

  it('builds and round-trips an immutable Structured CloudEvent with the exact transport headers', () => {
    const event = createOesCloudEvent(input)
    const encoded = encodeCloudEvent(event)
    const decoded = decodeCloudEvent(encoded.body, input.contract)

    expect(event).toMatchObject({
      specversion: '1.0',
      source: 'urn:oes:service:example-service',
      type: 'example.fact.happened',
      subject: 'aggregate-1',
      dataschema: 'urn:oes:event:example.fact.happened:v1',
      oeseventversion: 1,
      oestenantid: 'tenant-1',
    })
    expect(Object.isFrozen(event)).toBe(true)
    expect(encoded.headers).toEqual([
      ['Nats-Msg-Id', 'evt-1'],
      ['Content-Type', CLOUD_EVENTS_CONTENT_TYPE],
      ['Oes-Transport-Version', '1'],
    ])
    expect(decoded).toEqual(event)
    expect(validateNatsTransport({ subject: 'oes.events.example.fact.happened', headers: encoded.headers, event, contract: input.contract })).toEqual({ ok: true })
  })

  it('rejects duplicate required headers rather than guessing a value', () => {
    const event = createOesCloudEvent(input)
    const result = validateNatsTransport({
      subject: 'oes.events.example.fact.happened',
      event,
      contract: input.contract,
      headers: [
        ['Nats-Msg-Id', 'evt-1'],
        ['nats-msg-id', 'evt-1'],
        ['Content-Type', CLOUD_EVENTS_CONTENT_TYPE],
        ['Oes-Transport-Version', '1'],
      ],
    })

    expect(result).toEqual({ ok: false, code: 'EVENT_REQUIRED_HEADER_INVALID' })
  })

  it('rejects an oversized body before it can enter an outbox', () => {
    expect(() =>
      createOesCloudEvent({
        ...input,
        data: { value: 'x'.repeat(DEFAULT_EVENT_BODY_LIMIT_BYTES) },
      }),
    ).toThrow('EVENT_BODY_TOO_LARGE')
  })

  it('propagates a valid W3C trace context only as transport headers without duplicating it into the body', () => {
    const event = createOesCloudEvent(input)
    expect(encodeCloudEvent(event, {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'vendor=value',
    }).headers).toContainEqual(['traceparent', '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'])
  })

  it('allows absent optional actor, causation, and audit attributes without inventing fallback values', () => {
    const { actorAccountId: _actorAccountId, causationId: _causationId, auditRef: _auditRef, ...optionalInput } = input
    const event = createOesCloudEvent(optionalInput)

    expect(event).not.toHaveProperty('oesactoraccountid')
    expect(event).not.toHaveProperty('oescausationid')
    expect(event).not.toHaveProperty('oesauditref')
    expect(decodeCloudEvent(encodeCloudEvent(event).body, input.contract)).toEqual(event)
  })

  it('rejects invalid supplied optional attribution attributes', () => {
    expect(() => createOesCloudEvent({ ...input, actorAccountId: '' })).toThrow('EVENT_ACTOR_INVALID')
    const event = createOesCloudEvent(input)
    expect(() => decodeCloudEvent(Buffer.from(JSON.stringify({ ...event, oesauditref: '' })), input.contract)).toThrow('EVENT_AUDIT_REF_INVALID')
  })

  it('preserves the business profile by rejecting a security scope or missing aggregate attributes', () => {
    expect(() => createOesCloudEvent({ ...input, executionScope: 'TENANT' })).toThrow('EVENT_BUSINESS_SCOPE_FORBIDDEN')
    const { aggregateId: _aggregateId, ...missingAggregate } = input
    expect(() => createOesCloudEvent(missingAggregate)).toThrow('EVENT_AGGREGATE_ID_REQUIRED')
  })

  it.each([
    ['TENANT', 'tenant-1'],
    ['SYSTEM', undefined],
  ] as const)('round-trips a %s security event without fabricating a business aggregate', (executionScope, tenantId) => {
    const event = createOesCloudEvent({
      contract: securityContract,
      eventId: `evt-security-${executionScope.toLowerCase()}`,
      occurredAt: '2026-07-26T08:00:00.000Z',
      executionScope,
      ...(tenantId === undefined ? {} : { tenantId }),
      traceId: 'trace-security',
      data: { value: 'frozen' },
    })

    expect(event).toMatchObject({
      oesexecutionscope: executionScope,
      ...(tenantId === undefined ? {} : { oestenantid: tenantId }),
    })
    expect(event).not.toHaveProperty('subject')
    expect(event).not.toHaveProperty('oesaggregatetype')
    expect(event).not.toHaveProperty('oesaggregateid')
    expect(toNatsPublishRequest(event, securityContract).subject).toBe('oes.security.events.auth.execution-token.revoked')
    expect(decodeCloudEvent(encodeCloudEvent(event).body, securityContract)).toEqual(event)
  })

  it.each([
    ['TENANT', undefined, 'EVENT_TENANT_REQUIRED'],
    ['SYSTEM', 'tenant-1', 'EVENT_SCOPE_TENANT_INVALID'],
  ] as const)('fails closed for an illegal %s security scope and tenant combination', (executionScope, tenantId, code) => {
    expect(() => createOesCloudEvent({
      contract: securityContract,
      eventId: 'evt-security-invalid',
      occurredAt: '2026-07-26T08:00:00.000Z',
      executionScope,
      ...(tenantId === undefined ? {} : { tenantId }),
      traceId: 'trace-security',
      data: { value: 'frozen' },
    })).toThrow(code)
  })

  it.each([
    ['owner', { ownerService: 'security-service' }],
    ['type', { eventType: 'security.fact.happened' }],
    ['version', { eventVersion: 2 }],
  ])('fails closed for a non-frozen security %s descriptor', (_caseName, mutation) => {
    expect(() => createOesCloudEvent({
      contract: { ...securityContract, ...mutation },
      eventId: 'evt-security-unfrozen',
      occurredAt: '2026-07-26T08:00:00.000Z',
      executionScope: 'SYSTEM',
      traceId: 'trace-security',
      data: { value: 'opaque' },
    })).toThrow('EVENT_SECURITY_CONTRACT_UNSUPPORTED')
  })
})

/** Verifies normalized JetStream and operations primitives without leaking NATS client types into callers. */
describe('event platform operations', () => {
  const event = createOesCloudEvent({
    contract: { eventType: 'example.fact.happened', eventVersion: 1, ownerService: 'example-service', validateData: (data: unknown): data is { value: string } => typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string' },
    eventId: 'evt-operations', occurredAt: '2026-07-26T08:00:00.000Z', tenantId: 'tenant-1', aggregateType: 'EXAMPLE', aggregateId: 'aggregate-1', actorAccountId: 'account-1', traceId: 'trace-1', causationId: 'command-1', auditRef: 'audit-1', data: { value: 'frozen' },
  })

  it('normalizes a JetStream acknowledgement without exposing a provider client to application code', async () => {
    const adapter = new NatsJetStreamAdapter({
      publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 4, duplicate: true }),
    })

    await expect(adapter.publish(event, { eventType: 'example.fact.happened', eventVersion: 1, ownerService: 'example-service', validateData: (data: unknown): data is { value: string } => typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string' })).resolves.toEqual({ kind: 'ACKNOWLEDGED', stream: 'OES_BUSINESS_EVENTS', sequence: 4, duplicate: true })
  })

  it.each([
    ['owner', { source: 'urn:oes:service:other-service' }],
    ['version', { oeseventversion: 2 }],
    ['aggregate subject', { subject: 'other-aggregate' }],
    ['tenant', { oestenantid: '' }],
  ])('quarantines an untrusted %s envelope before provider publish', async (_caseName, mutation) => {
    const calls: string[] = []
    const adapter = new NatsJetStreamAdapter({ publish: async () => { calls.push('publish'); return { stream: 'OES_BUSINESS_EVENTS', sequence: 4 } } })
    const contract = { eventType: 'example.fact.happened', eventVersion: 1, ownerService: 'example-service', validateData: (data: unknown): data is { value: string } => typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string' }

    await expect(adapter.publish({ ...event, ...mutation }, contract)).resolves.toMatchObject({ kind: 'QUARANTINED_FAILURE' })
    expect(calls).toEqual([])
  })

  it('rejects inbound tracestate without a valid traceparent before typed delivery decoding', () => {
    const encoded = encodeCloudEvent(event)
    const adapter = new NatsJetStreamAdapter({ publish: async () => ({ stream: 'OES_BUSINESS_EVENTS', sequence: 4 }) })
    const contract = { eventType: 'example.fact.happened', eventVersion: 1, ownerService: 'example-service', validateData: (data: unknown): data is { value: string } => typeof data === 'object' && data !== null && typeof (data as { value?: unknown }).value === 'string' }

    expect(() => adapter.decodeDelivery({ subject: 'oes.events.example.fact.happened', headers: [...encoded.headers, ['tracestate', 'vendor=value']], body: encoded.body, deliveryAttempt: 1, ack: async () => undefined, nak: async () => undefined, term: async () => undefined }, contract)).toThrow('EVENT_W3C_TRACEPARENT_REQUIRED')
  })

  it('builds the frozen Inbox identity tuple from the immutable decoded event and body digest', () => {
    const encoded = encodeCloudEvent(event)
    expect(createInboxIdentity('notification-service__collaboration-task__v1', event, encoded.body)).toMatchObject({
      consumerName: 'notification-service__collaboration-task__v1', eventId: 'evt-operations', tenantId: 'tenant-1', eventType: 'example.fact.happened', eventVersion: 1,
      identityTuple: ['evt-operations', 'urn:oes:service:example-service', 'example.fact.happened', '2026-07-26T08:00:00.000Z', 1, 'tenant-1', 'EXAMPLE', 'aggregate-1'],
    })
  })

  it('publishes the immutable DLQ record before terminating the original delivery', async () => {
    const original = encodeCloudEvent(event)
    const calls: string[] = []
    const record = createDlqRecord({
      consumerName: 'notification-service__collaboration-task__v1',
      event,
      original: { subject: 'oes.events.example.fact.happened', headers: original.headers, body: original.body },
      errorClass: 'NON_RETRYABLE', stableErrorCode: 'EVENT_VERSION_UNSUPPORTED', sanitizedErrorSummary: 'unsupported version', deliveryAttempts: 5,
      firstFailedAt: '2026-07-26T08:01:00.000Z', lastFailedAt: '2026-07-26T08:02:00.000Z', streamSequence: 4, consumerSequence: 5,
    })

    await expect(transferToDlqThenTerm({
      record,
      publishDlq: async () => { calls.push('publish'); return { kind: 'ACKNOWLEDGED', stream: 'OES_EVENT_DLQ', sequence: 3, duplicate: false } },
      term: async () => { calls.push('term') },
    })).resolves.toEqual({ kind: 'TERMINATED' })
    expect(calls).toEqual(['publish', 'term'])
  })

  it('runs SAFE_REDELIVERY only for the approved tenant and never republishes a new event', async () => {
    const applied: string[] = []
    await expect(runSafeRedelivery({
      request: {
        replayRunId: 'run-1', requestedBy: 'operator-1', approvedByConsumerOwner: 'owner-1', approvedByPlatformOperator: 'platform-1', platformApprovalRef: 'approval-1',
        consumerName: 'notification-service__collaboration-task__v1', tenantScope: ['tenant-1'], eventFilter: { eventTypes: ['example.fact.happened'] }, mode: 'SAFE_REDELIVERY', reason: 'repair', allowExternalSideEffects: false,
      },
      messages: [event],
      handle: async (received) => { applied.push(received.id); return { kind: 'DUPLICATE' } },
    })).resolves.toEqual({ scanned: 1, handled: 1, skipped: 0, outcomes: ['DUPLICATE'] })
    expect(applied).toEqual(['evt-operations'])
  })

  it('creates three single-subject replay durables for the approved Collaboration Task subjects', () => {
    expect(
      createSafeRedeliveryConsumerSpecs({
        replayRunId: 'run-1',
        requestedBy: 'operator-1',
        approvedByConsumerOwner: 'owner-1',
        approvedByPlatformOperator: 'platform-1',
        platformApprovalRef: 'approval-1',
        consumerName: 'notification-service__collaboration-task__v1',
        tenantScope: ['tenant-1'],
        eventFilter: {
          eventTypes: [
            'collaboration.task.assigned',
            'collaboration.task.completed',
            'collaboration.task.cancelled'
          ],
          fromSequence: 7
        },
        mode: 'SAFE_REDELIVERY',
        reason: 'repair',
        allowExternalSideEffects: false
      })
    ).toEqual([
      {
        durableName: 'notification-service__replay__run-1__assigned',
        filterSubjects: ['oes.events.collaboration.task.assigned'],
        start: { sequence: 7, time: undefined }
      },
      {
        durableName: 'notification-service__replay__run-1__completed',
        filterSubjects: ['oes.events.collaboration.task.completed'],
        start: { sequence: 7, time: undefined }
      },
      {
        durableName: 'notification-service__replay__run-1__cancelled',
        filterSubjects: ['oes.events.collaboration.task.cancelled'],
        start: { sequence: 7, time: undefined }
      }
    ])
  })

  it('fails closed on a persisted max-delivery advisory when no source delivery TERM authority exists', async () => {
    await expect(recoverMaxDeliveryToDlq({
      advisory: { stream: 'OES_BUSINESS_EVENTS', consumer: 'notification-service__collaboration-task__v1', stream_seq: 4, consumer_seq: 5, deliveries: 5 },
    })).resolves.toEqual({
      kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED',
      advisory: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        streamSequence: 4,
        consumerSequence: 5,
        deliveries: 5
      }
    })
  })
})
