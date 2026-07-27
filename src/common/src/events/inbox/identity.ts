import { digestCanonicalBody } from '../cloud-events/codec'
import type { OesCloudEvent } from '../cloud-events/types'
import type { EventInboxIdentity } from '../contracts/ports'

/** Derives the immutable Inbox comparison material that a consumer persists in its own local transaction. */
export function createInboxIdentity(consumerName: string, event: OesCloudEvent, canonicalBody: Uint8Array): EventInboxIdentity {
  if (!consumerName.trim()) throw new Error('INBOX_CONSUMER_NAME_REQUIRED')
  return Object.freeze({
    consumerName,
    eventId: event.id,
    tenantId: event.oestenantid,
    identityTuple: Object.freeze([
      event.id,
      event.source,
      event.type,
      event.time,
      event.oeseventversion,
      event.oestenantid,
      event.oesaggregatetype,
      event.oesaggregateid,
    ]) as EventInboxIdentity['identityTuple'],
    canonicalBodyDigest: digestCanonicalBody(canonicalBody),
    eventType: event.type,
    eventVersion: event.oeseventversion,
    traceId: event.oestraceid,
  })
}
