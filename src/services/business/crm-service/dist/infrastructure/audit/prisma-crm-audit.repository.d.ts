import { AuditEnvelope } from '@oes/common';
import { CrmAuditWriter } from '../../application/ports/crm-audit-writer.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaCrmAuditRepository persists local CRM audit envelopes inside the service database. */
export declare class PrismaCrmAuditRepository implements CrmAuditWriter {
    private readonly prisma;
    constructor(prisma: PrismaService);
    append(envelope: AuditEnvelope): Promise<void>;
}
