import { AuditEnvelope } from '@oes/common';
/** CrmAuditWriter appends one CRM local audit envelope inside or immediately after command execution. */
export interface CrmAuditWriter {
    append(envelope: AuditEnvelope): Promise<void>;
}
