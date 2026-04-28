import { AuditEnvelope } from '@oes/common';
/** ProcurementAuditWriter appends one procurement local audit envelope inside or immediately after command execution. */
export interface ProcurementAuditWriter {
    append(envelope: AuditEnvelope): Promise<void>;
}
