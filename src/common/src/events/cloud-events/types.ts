/** Defines the provider-neutral CloudEvents shape used as the immutable OES public-event body. */
export interface OesCloudEvent<TData = unknown> {
  readonly specversion: '1.0'
  readonly id: string
  readonly source: string
  readonly type: string
  readonly subject: string
  readonly time: string
  readonly datacontenttype: 'application/json'
  readonly dataschema: string
  readonly oeseventversion: number
  readonly oestenantid: string
  readonly oesorgid?: string | null
  readonly oesaggregatetype: string
  readonly oesaggregateid: string
  readonly oesactoraccountid?: string | null
  readonly oestraceid: string
  readonly oescorrelationid?: string | null
  readonly oescausationid?: string | null
  readonly oesauditref?: string | null
  readonly data: TData
}

/** Describes the owner-approved code contract required to build or consume one event version. */
export interface OesEventContract<TData = unknown> {
  readonly eventType: string
  readonly eventVersion: number
  readonly ownerService: string
  readonly validateData: (data: unknown) => data is TData
}

/** Supplies verified service context and aggregate identity to the CloudEvents builder. */
export interface CreateOesCloudEventInput<TData> {
  readonly contract: OesEventContract<TData>
  readonly eventId: string
  readonly occurredAt: string
  readonly tenantId: string
  readonly orgId?: string | null
  readonly aggregateType: string
  readonly aggregateId: string
  readonly actorAccountId?: string | null
  readonly traceId: string
  readonly correlationId?: string | null
  readonly causationId?: string | null
  readonly auditRef?: string | null
  readonly data: TData
}

/** Carries immutable source message material for consumer-owned DLQ and recovery workflows. */
export interface ImmutableEventMessage {
  readonly subject: string
  readonly headers: readonly (readonly [string, string])[]
  readonly body: Uint8Array
}
