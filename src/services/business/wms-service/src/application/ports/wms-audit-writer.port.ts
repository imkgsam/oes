import { AuditEnvelope } from '@oes/common'

/** WmsAuditWriter appends one WMS local audit envelope inside or immediately after command execution. */
export interface WmsAuditWriter {
  append(envelope: AuditEnvelope): Promise<void>
}
