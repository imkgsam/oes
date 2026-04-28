import { AuditEnvelope } from '@oes/common'

/** SrmAuditWriter appends one SRM local audit envelope inside or immediately after command execution. */
export interface SrmAuditWriter {
  append(envelope: AuditEnvelope): Promise<void>
}
