import { AuditEnvelope } from '@oes/common'

/** FinanceAuditWriter persists local audit envelopes for management commands executed by finance-service. */
export interface FinanceAuditWriter {
  append(envelope: AuditEnvelope): Promise<void>
}
