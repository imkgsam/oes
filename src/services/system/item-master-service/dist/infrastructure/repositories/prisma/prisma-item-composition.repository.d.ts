import { ItemCompositionRecord, ItemCompositionRepository } from '../../../domain/repositories/item-composition.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaItemCompositionRepository persists full-replacement bundle composition rows with stable ordering. */
export declare class PrismaItemCompositionRepository implements ItemCompositionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    replaceForParent(tenantId: string, parentItemId: string, componentItemIds: string[]): Promise<ItemCompositionRecord[]>;
    listByParentId(tenantId: string, parentItemId: string): Promise<ItemCompositionRecord[]>;
}
