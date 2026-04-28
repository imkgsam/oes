import { AuditEnvelope } from '@oes/common';
import { SrmAuditWriter } from '../../application/ports/srm-audit-writer.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaSrmAuditRepository persists local SRM audit envelopes inside the service database. */
export declare class PrismaSrmAuditRepository implements SrmAuditWriter {
    private readonly prisma;
    constructor(prisma: PrismaService);
    append(envelope: AuditEnvelope): Promise<void>;
}
