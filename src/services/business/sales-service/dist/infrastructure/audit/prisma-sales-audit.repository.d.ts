import { AuditEnvelope } from '@oes/common';
import { SalesAuditWriter } from '../../application/ports/sales-audit-writer.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaSalesAuditRepository persists local sales command audit envelopes inside the service database. */
export declare class PrismaSalesAuditRepository implements SalesAuditWriter {
    private readonly prisma;
    constructor(prisma: PrismaService);
    append(envelope: AuditEnvelope): Promise<void>;
}
