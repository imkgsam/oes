import { AuditEnvelope } from '@oes/common';
/** ItemMasterAuditWriter persists local command audit envelopes for phase 1 management RPCs. */
export interface ItemMasterAuditWriter {
    append(envelope: AuditEnvelope): Promise<void>;
}
