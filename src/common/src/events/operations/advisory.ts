/** Captures the durable consumer location needed by consumer-owned max-delivery DLQ recovery. */
export interface MaxDeliveryAdvisory {
  readonly stream: string
  readonly consumer: string
  readonly streamSequence: number
  readonly consumerSequence: number
  readonly deliveries: number
}

/** Parses the persisted JetStream max-deliver advisory payload without inventing consumer business behavior. */
export function parseMaxDeliveryAdvisory(value: unknown): MaxDeliveryAdvisory {
  if (typeof value !== 'object' || value === null) throw new Error('ADVISORY_INVALID')
  const source = value as Record<string, unknown>
  const stream = stringField(source, 'stream')
  const consumer = stringField(source, 'consumer')
  const streamSequence = numberField(source, 'stream_seq')
  const consumerSequence = numberField(source, 'consumer_seq')
  const deliveries = numberField(source, 'deliveries')
  return { stream, consumer, streamSequence, consumerSequence, deliveries }
}

/** Ensures required advisory text fields remain explicit rather than being guessed from a subject. */
function stringField(value: Record<string, unknown>, field: string): string {
  if (typeof value[field] !== 'string' || !(value[field] as string).trim()) throw new Error('ADVISORY_INVALID')
  return value[field] as string
}

/** Ensures required advisory sequence fields can safely address the original retained stream message. */
function numberField(value: Record<string, unknown>, field: string): number {
  if (!Number.isInteger(value[field]) || (value[field] as number) < 1) throw new Error('ADVISORY_INVALID')
  return value[field] as number
}
