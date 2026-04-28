import { AuditEnvelope } from '@oes/common';
import { ProcurementAuditWriter } from '../../application/ports/procurement-audit-writer.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaProcurementAuditRepository persists local procurement command audit envelopes inside the service database. */
export declare class PrismaProcurementAuditRepository implements ProcurementAuditWriter {
    private readonly prisma;
    constructor(prisma: PrismaService);
    append(envelope: AuditEnvelope): Promise<void>;
}
