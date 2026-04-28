import { AuditEnvelope } from '@oes/common';
import { SalesAuditWriter } from '../../application/ports/sales-audit-writer.port';
import { SalesInMemoryStore } from '../store/sales-in-memory-store';
/** InMemorySalesAuditRepository keeps local command audit envelopes inside the phase 1 process-local skeleton store. */
export declare class InMemorySalesAuditRepository implements SalesAuditWriter {
    private readonly store;
    constructor(store: SalesInMemoryStore);
    append(envelope: AuditEnvelope): Promise<void>;
}
