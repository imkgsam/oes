import { AuditEnvelope } from '@oes/common';
import { WmsAuditWriter } from '../../application/ports/wms-audit-writer.port';
import { PrismaService } from '../prisma/prisma.service';
/** PrismaWmsAuditRepository persists local WMS command audit envelopes inside the service database. */
export declare class PrismaWmsAuditRepository implements WmsAuditWriter {
    private readonly prisma;
    constructor(prisma: PrismaService);
    append(envelope: AuditEnvelope): Promise<void>;
}
