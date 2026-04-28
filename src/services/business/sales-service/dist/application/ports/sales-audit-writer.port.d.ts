import { AuditEnvelope } from '@oes/common';
/** SalesAuditWriter persists local audit envelopes for management commands executed by sales-service. */
export interface SalesAuditWriter {
    append(envelope: AuditEnvelope): Promise<void>;
}
