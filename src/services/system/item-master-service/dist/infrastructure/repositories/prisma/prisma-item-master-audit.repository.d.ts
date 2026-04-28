import { AuditEnvelope } from '@oes/common';
import { AppLogger } from '@oes/common/logging';
import { ItemMasterAuditWriter } from '../../../application/ports/item-master-audit-writer.port';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaItemMasterAuditRepository persists local command audit envelopes and mirrors them into structured logs. */
export declare class PrismaItemMasterAuditRepository implements ItemMasterAuditWriter {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService, logger: AppLogger);
    append(envelope: AuditEnvelope): Promise<void>;
}
