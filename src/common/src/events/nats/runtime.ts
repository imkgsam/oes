import { Module, type DynamicModule, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'

import type { OesCloudEvent, OesEventContract } from '../cloud-events/types'
import {
  EventContractError,
  subjectForEventType,
  type W3cTraceHeaders
} from '../cloud-events/codec'
import type { EventConsumeOutcome, EventPublishOutcome, EventTraceHook } from '../contracts/ports'
import { NatsJetStreamAdapter, normalizePublishFailure, type JetStreamDelivery } from './adapter'
import type { EventHeaders } from './transport'
import { parseMaxDeliveryAdvisory } from '../operations/advisory'
import {
  createDlqRecord,
  dlqSubjectForConsumer,
  transferToDlqThenTerm,
  type DlqRecord
} from '../operations/dlq'
import {
  createSafeRedeliveryConsumerSpecs,
  validateSafeRedeliveryRequest,
  type SafeRedeliveryRequest
} from '../operations/replay'

/** Holds the minimal NATS client surface privately consumed by this infrastructure adapter. */
interface ProviderHeaders extends Iterable<[string, string[]]> {
  append(name: string, value: string): void
}

/** Holds one raw NATS delivery internally before it becomes a provider-neutral common delivery. */
interface ProviderMessage {
  readonly subject: string
  readonly headers?: ProviderHeaders
  readonly data: Uint8Array
  readonly redelivered: boolean
  readonly info: {
    readonly stream: string
    readonly consumer: string
    readonly deliveryCount: number
    readonly streamSequence: number
    readonly deliverySequence: number
    readonly pending: number
  }
  ack(): void
  nak(delayMs?: number): void
  term(): void
}

/** Holds the minimal NATS connection surface privately consumed by this infrastructure adapter. */
interface ProviderConnection {
  jetstream(): {
    publish(
      subject: string,
      body: Uint8Array,
      options: { readonly headers: ProviderHeaders }
    ): Promise<{ readonly stream: string; readonly seq: number; readonly duplicate: boolean }>
    consumers: {
      get(
        stream: string,
        consumer: string
      ): Promise<{ next(options: { readonly expires: number }): Promise<ProviderMessage | null> }>
    }
  }
  jetstreamManager(): Promise<{
    readonly consumers: {
      info(
        stream: string,
        consumer: string
      ): Promise<{ readonly config: { readonly filter_subject?: string; readonly filter_subjects?: readonly string[] } }>
      add(
        stream: string,
        config: {
          readonly durable_name: string
          readonly ack_policy: 'explicit'
          readonly deliver_policy: 'by_start_sequence' | 'by_start_time'
          readonly opt_start_seq?: number
          readonly opt_start_time?: string
          readonly replay_policy: 'instant'
          readonly filter_subject: string
        }
      ): Promise<unknown>
    }
  }>
  drain(): Promise<void>
}

/** Loads the NATS JavaScript client at the infrastructure boundary without exporting its declarations. */
const natsClient = require('nats') as {
  connect(options: {
    readonly servers: readonly string[]
    readonly user: string
    readonly pass: string
    readonly name?: string
  }): Promise<ProviderConnection>
  headers(): ProviderHeaders
}

/** Defines the explicit, secret-injected configuration required by the JetStream runtime. */
export interface NatsJetStreamRuntimeOptions {
  readonly servers: readonly string[]
  readonly user: string
  readonly password: string
  readonly name?: string
}

/** Parses and validates the environment-only configuration for one ACL-scoped NATS client. */
export class NatsJetStreamRuntimeConfig {
  /** Reads broker endpoints and credentials without providing any insecure defaults. */
  static fromEnvironment(environment: NodeJS.ProcessEnv): NatsJetStreamRuntimeOptions {
    const url = required(environment.NATS_URL, 'NATS_URL_REQUIRED')
    const user = required(environment.NATS_USER, 'NATS_USER_REQUIRED')
    const password = required(environment.NATS_PASSWORD, 'NATS_PASSWORD_REQUIRED')
    const servers = url
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (!servers.length) throw new Error('NATS_URL_REQUIRED')
    return {
      servers,
      user,
      password,
      ...(environment.NATS_CLIENT_NAME?.trim() ? { name: environment.NATS_CLIENT_NAME.trim() } : {})
    }
  }
}

/** Names the private DI tokens through which an infrastructure module supplies the runtime. */
export const NATS_JETSTREAM_RUNTIME_OPTIONS = Symbol('NATS_JETSTREAM_RUNTIME_OPTIONS')
/** Names the private DI token that may replace the concrete NATS connection in focused tests. */
export const NATS_JETSTREAM_CONNECTOR = Symbol('NATS_JETSTREAM_CONNECTOR')

/** Carries one normalized JetStream pull delivery without exposing an NATS message to services. */
export interface NatsPullDelivery {
  readonly subject: string
  readonly headers: EventHeaders
  readonly body: Uint8Array
  readonly deliveryAttempt: number
  readonly metadata: {
    readonly stream: string
    readonly consumer: string
    readonly streamSequence: number
    readonly consumerSequence: number
    readonly pending: number
    readonly redelivered: boolean
  }
  ack(): Promise<void>
  nak(delayMs?: number): Promise<void>
  term(): Promise<void>
}

/** Defines the provider-private connection surface used by the common runtime and focused tests. */
export interface NatsJetStreamConnection {
  publish(request: {
    readonly subject: string
    readonly headers: EventHeaders
    readonly body: Uint8Array
  }): Promise<{ readonly stream: string; readonly sequence: number; readonly duplicate: boolean }>
  next(input: {
    readonly stream: string
    readonly consumer: string
    readonly expiresMs: number
  }): Promise<NatsPullDelivery | null>
  createOrResumeConsumer?(input: NatsRunScopedConsumerSpec): Promise<void>
  drain(): Promise<void>
}

/** Defines a provider-neutral run-scoped durable consumer without exposing NATS configuration to service code. */
export interface NatsRunScopedConsumerSpec {
  readonly stream: string
  readonly durableName: string
  readonly filterSubjects: readonly string[]
  readonly start: { readonly sequence?: number; readonly time?: string }
}

/** Creates the provider-private connection surface from the selected NATS JavaScript client. */
export interface NatsJetStreamConnector {
  connect(options: NatsJetStreamRuntimeOptions): Promise<NatsJetStreamConnection>
}

/** Owns the concrete NATS JavaScript client conversion while keeping its types inside common infrastructure. */
class DefaultNatsJetStreamConnector implements NatsJetStreamConnector {
  /** Connects with the deployment-injected credential and wraps only normalized provider operations. */
  async connect(options: NatsJetStreamRuntimeOptions): Promise<NatsJetStreamConnection> {
    const connection = await natsClient.connect({
      servers: [...options.servers],
      user: options.user,
      pass: options.password,
      name: options.name
    })
    const client = connection.jetstream()
    return {
      publish: async (request) => {
        const acknowledgement = await client.publish(request.subject, request.body, {
          headers: toNatsHeaders(request.headers)
        })
        return {
          stream: acknowledgement.stream,
          sequence: acknowledgement.seq,
          duplicate: acknowledgement.duplicate
        }
      },
      next: async (input) => {
        const consumer = await client.consumers.get(input.stream, input.consumer)
        const message = await consumer.next({ expires: input.expiresMs })
        return message ? toPullDelivery(message) : null
      },
      createOrResumeConsumer: async (input) => {
        const manager = await connection.jetstreamManager()
        try {
          const existing = await manager.consumers.info(input.stream, input.durableName)
          assertExactReplayFilterSubjects(existing.config, input.filterSubjects)
          return
        } catch (error) {
          if (!isConsumerMissing(error)) throw error
        }
        await manager.consumers.add(input.stream, {
          durable_name: input.durableName,
          ack_policy: 'explicit',
          deliver_policy:
            input.start.sequence !== undefined ? 'by_start_sequence' : 'by_start_time',
          ...(input.start.sequence !== undefined
            ? { opt_start_seq: input.start.sequence }
            : { opt_start_time: input.start.time }),
          replay_policy: 'instant',
          filter_subject: input.filterSubjects[0]
        })
      },
      drain: () => connection.drain()
    }
  }
}

/** Maintains one injectable JetStream connection and drains it cleanly during application shutdown. */
export class NatsJetStreamClient implements OnModuleInit, OnModuleDestroy {
  private connection: NatsJetStreamConnection | undefined

  /** Receives one explicit service credential and an internal connector implementation. */
  constructor(
    private readonly options: NatsJetStreamRuntimeOptions,
    private readonly connector: NatsJetStreamConnector = new DefaultNatsJetStreamConnector()
  ) {}

  /** Opens the broker connection only as the hosting Nest module starts. */
  async onModuleInit(): Promise<void> {
    this.connection = await this.connector.connect(this.options)
  }

  /** Publishes immutable transport material and waits for a JetStream acknowledgement. */
  async publish(request: {
    readonly subject: string
    readonly headers: EventHeaders
    readonly body: Uint8Array
  }): Promise<{
    readonly stream: string
    readonly sequence: number
    readonly duplicate?: boolean
  }> {
    return this.requireConnection().publish(request)
  }

  /** Retrieves exactly one message from a pre-provisioned durable pull consumer. */
  async next(input: {
    readonly stream: string
    readonly consumer: string
    readonly expiresMs: number
  }): Promise<NatsPullDelivery | null> {
    return this.requireConnection().next(input)
  }

  /** Creates a restricted replay consumer once or resumes its durable JetStream progress without resetting it. */
  async createOrResumeConsumer(input: NatsRunScopedConsumerSpec): Promise<void> {
    assertRunScopedConsumerSpec(input)
    const createOrResume = this.requireConnection().createOrResumeConsumer
    if (!createOrResume) throw new Error('NATS_REPLAY_CONSUMER_UNSUPPORTED')
    await createOrResume(input)
  }

  /** Drains in-flight broker work and prevents later accidental use after Nest shutdown. */
  async onModuleDestroy(): Promise<void> {
    const connection = this.connection
    this.connection = undefined
    if (connection) await connection.drain()
  }

  /** Fails closed when application code tries to use the runtime before its lifecycle initialization. */
  private requireConnection(): NatsJetStreamConnection {
    if (!this.connection) throw new Error('NATS_RUNTIME_NOT_STARTED')
    return this.connection
  }
}

/** Declares one pre-provisioned durable pull consumer and its service-owned delivery callback. */
export interface DurablePullRunnerOptions {
  readonly stream: string
  readonly consumer: string
  readonly expiresMs: number
  readonly handle: (delivery: NatsPullDelivery) => Promise<void>
}

/** Owns the lifecycle of one service-local durable pull loop and never creates broker topology. */
export class NatsDurablePullWorker {
  private running = true
  private readonly completed: Promise<void>

  /** Starts the bounded pull loop against an already provisioned durable consumer. */
  constructor(
    private readonly runner: NatsDurablePullRunner,
    private readonly options: DurablePullRunnerOptions
  ) {
    this.completed = this.consume()
  }

  /** Stops after the currently bounded pull completes, leaving consumer progress entirely in JetStream. */
  async stop(): Promise<void> {
    this.running = false
    await this.completed
  }

  /** Repeats bounded pulls while the owning service worker remains active. */
  private async consume(): Promise<void> {
    while (this.running) await this.runner.runOnce(this.options)
  }
}

/** Provides exact durable pull delivery without leaking NATS message or consumer types to a service. */
export class NatsDurablePullRunner implements OnModuleDestroy {
  private readonly workers = new Set<NatsDurablePullWorker>()

  /** Uses the shared runtime client without assuming service business behavior. */
  constructor(private readonly client: NatsJetStreamClient) {}

  /** Reads and delegates at most one delivery from the named durable consumer. */
  async runOnce(options: DurablePullRunnerOptions): Promise<boolean> {
    assertPullOptions(options)
    const delivery = await this.client.next(options)
    if (!delivery) return false
    await options.handle(delivery)
    return true
  }

  /** Starts one independent service-local worker over a pre-provisioned durable consumer. */
  start(options: DurablePullRunnerOptions): NatsDurablePullWorker {
    assertPullOptions(options)
    const worker = new NatsDurablePullWorker(this, options)
    this.workers.add(worker)
    return worker
  }

  /** Stops all workers before the shared broker client is drained by Nest shutdown. */
  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.workers].map((worker) => worker.stop()))
    this.workers.clear()
  }
}

/** Binds the shared runtime to the existing immutable-outbox publisher port. */
export class NatsJetStreamPublisher {
  private readonly adapter: NatsJetStreamAdapter

  /** Wraps the concrete runtime behind the already accepted provider-neutral adapter. */
  constructor(client: NatsJetStreamClient, traceHook?: EventTraceHook) {
    this.adapter = new NatsJetStreamAdapter(client, traceHook)
  }

  /** Publishes one validated immutable CloudEvent and waits for the broker acknowledgement outcome. */
  publish<TData>(
    event: OesCloudEvent<TData>,
    contract: OesEventContract<TData>,
    traceHeaders?: W3cTraceHeaders
  ): Promise<EventPublishOutcome> {
    return this.adapter.publish(event, contract, traceHeaders)
  }
}

/** Enforces consumer-specific DLQ persistence before the original durable delivery may terminate. */
export class NatsConsumerDlqBinding {
  /** Uses the shared runtime credential, whose ACL must allow only this consumer's DLQ subject. */
  constructor(private readonly client: NatsJetStreamClient) {}

  /** Publishes a deterministic immutable DLQ record before sending TERM to the original delivery. */
  transfer(
    record: DlqRecord,
    delivery: Pick<JetStreamDelivery, 'term'>
  ): Promise<
    | { readonly kind: 'TERMINATED' }
    | { readonly kind: 'DLQ_RETRY_REQUIRED'; readonly outcome: EventPublishOutcome }
  > {
    return transferToDlqThenTerm({
      record,
      publishDlq: (candidate, subject) => this.publish(candidate, subject),
      term: () => delivery.term()
    })
  }

  /** Publishes only the immutable record to its exclusive subject with a deterministic broker idempotency key. */
  private async publish(record: DlqRecord, subject: string): Promise<EventPublishOutcome> {
    if (subject !== dlqSubjectForConsumer(record.consumerName))
      return {
        kind: 'QUARANTINED_FAILURE',
        code: 'DLQ_SUBJECT_MISMATCH',
        message: 'consumer-specific DLQ subject mismatch'
      }
    try {
      const acknowledgement = await this.client.publish({
        subject,
        headers: [
          ['Nats-Msg-Id', record.dlqRecordId],
          ['Content-Type', 'application/json']
        ],
        body: Buffer.from(JSON.stringify(record), 'utf8')
      })
      return {
        kind: 'ACKNOWLEDGED',
        stream: acknowledgement.stream,
        sequence: acknowledgement.sequence,
        duplicate: acknowledgement.duplicate === true
      }
    } catch (error) {
      return normalizePublishFailure(error)
    }
  }
}

/** Declares the target consumer-owned transfer seam used by advisory recovery without a shared control store. */
export interface ConsumerDlqTransferBinding {
  readonly consumerName: string
  transfer(
    record: DlqRecord,
    delivery: Pick<NatsPullDelivery, 'term'>
  ): Promise<
    | { readonly kind: 'TERMINATED' }
    | { readonly kind: 'DLQ_RETRY_REQUIRED'; readonly outcome: EventPublishOutcome }
  >
}

/** Fails closed for a max-delivery advisory because JetStream does not expose a source delivery token in it. */
export class NatsMaxDeliveryRecovery {
  /** Receives the runtime only to retain the common construction boundary; advisory recovery never uses raw management APIs. */
  constructor(_client: NatsJetStreamClient) {}

  /** Preserves the advisory as unresolved instead of fabricating the ACK/TERM reply subject required by JetStream. */
  async recover(input: {
    readonly advisory: unknown
    readonly target: Pick<ConsumerDlqTransferBinding, 'consumerName'>
  }): Promise<{
    readonly kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED'
    readonly advisory: ReturnType<typeof parseMaxDeliveryAdvisory>
  }> {
    const advisory = parseMaxDeliveryAdvisory(input.advisory)
    if (advisory.consumer !== input.target.consumerName)
      throw new Error('NATS_ADVISORY_CONSUMER_MISMATCH')
    return { kind: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED', advisory }
  }
}

/** Defines the consumer-owned data common needs to safely execute one bounded durable replay pull. */
export interface NatsSafeRedeliveryRunOptions {
  readonly stream: string
  readonly expiresMs: number
  readonly request: SafeRedeliveryRequest
  readonly approvedSubjects: readonly string[]
  readonly contracts: readonly OesEventContract[]
  readonly handle: (event: OesCloudEvent) => Promise<EventConsumeOutcome>
}

/** Executes one run-scoped SAFE_REDELIVERY pull without publishing a new business event. */
export class NatsSafeRedeliveryRunner {
  private readonly adapter: NatsJetStreamAdapter
  private nextConsumerIndex = 0

  /** Uses the concrete provider client only inside common while leaving the handler and contracts provider-neutral. */
  constructor(
    private readonly client: NatsJetStreamClient,
    traceHook?: EventTraceHook
  ) {
    this.adapter = new NatsJetStreamAdapter(client, traceHook)
  }

  /** Creates or resumes all three ACL-bound durables, then advances one durable without resetting any progress. */
  async runOnce(input: NatsSafeRedeliveryRunOptions): Promise<{
    readonly kind: 'EMPTY' | 'SKIPPED' | 'ACKED' | 'RETRY_SCHEDULED' | 'REQUIRES_DLQ'
  }> {
    const consumers = safeRedeliveryConsumerSpecs(input)
    await Promise.all(consumers.map((consumer) => this.client.createOrResumeConsumer(consumer)))
    const consumer = consumers[this.nextConsumerIndex % consumers.length]
    this.nextConsumerIndex += 1
    const delivery = await this.client.next({
      stream: input.stream,
      consumer: consumer.durableName,
      expiresMs: input.expiresMs
    })
    if (!delivery) return { kind: 'EMPTY' }
    const contract = selectReplayContract(delivery.body, input.contracts)
    const decoded = this.adapter.decodeDelivery(delivery, contract)
    if (!matchesSafeRedelivery(decoded.event, input.request)) {
      await delivery.ack()
      return { kind: 'SKIPPED' }
    }
    const settlement = await this.adapter.settleDelivery(
      delivery,
      await input.handle(decoded.event)
    )
    return { kind: settlement }
  }
}

/** Supplies one shared NATS client to infrastructure adapters without exposing the provider to applications. */
export class NatsJetStreamModule {
  /** Installs one explicit-credential runtime whose lifecycle is owned by the importing Nest application. */
  static forRoot(options: NatsJetStreamRuntimeOptions): DynamicModule {
    return {
      module: NatsJetStreamModule,
      providers: [
        { provide: NATS_JETSTREAM_RUNTIME_OPTIONS, useValue: options },
        { provide: NATS_JETSTREAM_CONNECTOR, useValue: new DefaultNatsJetStreamConnector() },
        {
          provide: NatsJetStreamClient,
          useFactory: (
            runtimeOptions: NatsJetStreamRuntimeOptions,
            connector: NatsJetStreamConnector
          ) => new NatsJetStreamClient(runtimeOptions, connector),
          inject: [NATS_JETSTREAM_RUNTIME_OPTIONS, NATS_JETSTREAM_CONNECTOR]
        },
        {
          provide: NatsDurablePullRunner,
          useFactory: (client: NatsJetStreamClient) => new NatsDurablePullRunner(client),
          inject: [NatsJetStreamClient]
        },
        {
          provide: NatsJetStreamPublisher,
          useFactory: (client: NatsJetStreamClient) => new NatsJetStreamPublisher(client),
          inject: [NatsJetStreamClient]
        },
        {
          provide: NatsConsumerDlqBinding,
          useFactory: (client: NatsJetStreamClient) => new NatsConsumerDlqBinding(client),
          inject: [NatsJetStreamClient]
        }
      ],
      exports: [
        NatsJetStreamClient,
        NatsDurablePullRunner,
        NatsJetStreamPublisher,
        NatsConsumerDlqBinding
      ]
    }
  }
}

Module({})(NatsJetStreamModule)

/** Converts the provider header collection to the fixed tuple form used by the common transport contract. */
function toEventHeaders(value: ProviderMessage['headers']): EventHeaders {
  if (!value) return []
  return [...value].flatMap(([name, values]) =>
    values.map((headerValue) => [name, headerValue] as const)
  )
}

/** Converts fixed tuple headers to NATS headers at the sole provider boundary. */
function toNatsHeaders(value: EventHeaders) {
  const result = natsClient.headers()
  for (const [name, headerValue] of value) result.append(name, headerValue)
  return result
}

/** Wraps a NATS delivery with exact durable metadata and acknowledgement controls. */
function toPullDelivery(message: ProviderMessage): NatsPullDelivery {
  return {
    subject: message.subject,
    headers: toEventHeaders(message.headers),
    body: message.data,
    deliveryAttempt: message.info.deliveryCount,
    metadata: {
      stream: message.info.stream,
      consumer: message.info.consumer,
      streamSequence: message.info.streamSequence,
      consumerSequence: message.info.deliverySequence,
      pending: message.info.pending,
      redelivered: message.redelivered
    },
    ack: async () => {
      message.ack()
    },
    nak: async (delayMs?: number) => {
      message.nak(delayMs)
    },
    term: async () => {
      message.term()
    }
  }
}

/** Rejects missing credentials rather than silently connecting with anonymous access. */
function required(value: string | undefined, code: string): string {
  if (!value?.trim()) throw new Error(code)
  return value.trim()
}

/** Rejects ambiguous pull settings before a worker can accumulate unbounded broker requests. */
function assertPullOptions(options: DurablePullRunnerOptions): void {
  if (!options.stream?.trim() || !options.consumer?.trim())
    throw new Error('NATS_DURABLE_PULL_IDENTITY_REQUIRED')
  if (!Number.isInteger(options.expiresMs) || options.expiresMs < 1)
    throw new Error('NATS_PULL_EXPIRES_INVALID')
  if (typeof options.handle !== 'function') throw new Error('NATS_PULL_HANDLER_REQUIRED')
}

/** Validates the exact persisted replay consumer shape before common calls the broker management plane. */
function assertRunScopedConsumerSpec(input: NatsRunScopedConsumerSpec): void {
  if (!input.stream?.trim() || !/^notification-service__replay__[A-Za-z0-9_-]+__(assigned|completed|cancelled)$/.test(input.durableName))
    throw new Error('NATS_REPLAY_CONSUMER_IDENTITY_INVALID')
  if (
    input.filterSubjects.length !== 1 ||
    input.filterSubjects.some((subject) => !/^oes\.events\.[A-Za-z0-9.-]+$/.test(subject))
  )
    throw new Error('NATS_REPLAY_SUBJECTS_INVALID')
  if ((input.start.sequence === undefined) === (input.start.time === undefined))
    throw new Error('NATS_REPLAY_START_BOUND_REQUIRED')
  if (
    input.start.sequence !== undefined &&
    (!Number.isInteger(input.start.sequence) || input.start.sequence < 1)
  )
    throw new Error('NATS_REPLAY_START_SEQUENCE_INVALID')
  if (input.start.time !== undefined && Number.isNaN(Date.parse(input.start.time)))
    throw new Error('NATS_REPLAY_START_TIME_INVALID')
}

/** Rejects consumer reconfiguration so an existing replay run can only resume its own durable progress. */
function assertExactReplayFilterSubjects(
  actual: { readonly filter_subject?: string; readonly filter_subjects?: readonly string[] },
  expected: readonly string[]
): void {
  const filters = actual.filter_subject ? [actual.filter_subject] : actual.filter_subjects
  if (
    !filters ||
    filters.length !== expected.length ||
    filters.some((subject, index) => subject !== expected[index])
  ) {
    throw new Error('NATS_REPLAY_CONSUMER_CONFIG_MISMATCH')
  }
}

/** Recognizes a missing durable consumer without treating unrelated broker or authorization failures as creation permission. */
function isConsumerMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '404'
  )
}

/** Derives the exact run-scoped broker configuration from a dual-approved replay request and its approved subject allowlist. */
function safeRedeliveryConsumerSpecs(
  input: NatsSafeRedeliveryRunOptions
): readonly NatsRunScopedConsumerSpec[] {
  validateSafeRedeliveryRequest(input.request)
  if (input.stream !== 'OES_BUSINESS_EVENTS') throw new Error('NATS_SAFE_REDELIVERY_STREAM_INVALID')
  if (!Number.isInteger(input.expiresMs) || input.expiresMs < 1)
    throw new Error('NATS_PULL_EXPIRES_INVALID')
  if (
    !input.approvedSubjects.length ||
    input.approvedSubjects.some((subject) => !/^oes\.events\.[A-Za-z0-9.-]+$/.test(subject))
  ) {
    throw new Error('NATS_REPLAY_APPROVED_SUBJECTS_INVALID')
  }
  const specs = createSafeRedeliveryConsumerSpecs(input.request)
  const requiredSubjects = specs.map((spec) => spec.filterSubjects[0])
  if (
    input.approvedSubjects.length !== requiredSubjects.length ||
    input.approvedSubjects.some((subject, index) => subject !== requiredSubjects[index])
  ) {
    throw new Error('NATS_REPLAY_APPROVED_SUBJECTS_NOT_EXACT')
  }
  if (
    specs.length !== 3 ||
    specs.some((spec) =>
      spec.filterSubjects.length !== 1 ||
      !input.approvedSubjects.includes(spec.filterSubjects[0])
    )
  )
    throw new Error('NATS_REPLAY_SUBJECT_NOT_APPROVED')
  if (
    !input.contracts.length ||
    specs.some((spec) => spec.filterSubjects.some(
      (subject) =>
        !input.contracts.some((contract) => subjectForEventType(contract.eventType) === subject)
    ))
  ) {
    throw new Error('NATS_REPLAY_CONTRACT_NOT_APPROVED')
  }
  if (specs.some((spec) => spec.start.sequence === undefined && spec.start.time === undefined))
    throw new Error('NATS_REPLAY_START_BOUND_REQUIRED')
  return specs.map((spec) => ({ stream: input.stream, ...spec }))
}

/** Selects one trusted owner contract by wire identity before the full CloudEvent decoder validates every field. */
function selectReplayContract(
  body: Uint8Array,
  contracts: readonly OesEventContract[]
): OesEventContract {
  let candidate: unknown
  try {
    candidate = JSON.parse(Buffer.from(body).toString('utf8'))
  } catch {
    throw new EventContractError('EVENT_BODY_INVALID_JSON')
  }
  if (typeof candidate !== 'object' || candidate === null)
    throw new EventContractError('EVENT_ENVELOPE_INVALID')
  const event = candidate as { type?: unknown; oeseventversion?: unknown }
  const contract = contracts.find(
    (value) => value.eventType === event.type && value.eventVersion === event.oeseventversion
  )
  if (!contract) throw new EventContractError('EVENT_CONTRACT_UNAPPROVED')
  return contract
}

/** Applies tenant and optional request filters only after the selected contract has decoded the immutable CloudEvent. */
function matchesSafeRedelivery(event: OesCloudEvent, request: SafeRedeliveryRequest): boolean {
  const filter = request.eventFilter
  return (
    request.tenantScope.includes(event.oestenantid) &&
    (!filter.eventTypes?.length || filter.eventTypes.includes(event.type)) &&
    (!filter.eventIds?.length || filter.eventIds.includes(event.id))
  )
}
