import { Item } from '../../../domain/aggregates/item.aggregate';
import { ItemRepository, SearchItemsInput, SearchItemsResult } from '../../../domain/repositories/item.repository';
import { PrismaService } from '../../prisma/prisma.service';
/** PrismaItemRepository persists item aggregates and catalog searches through Prisma. */
export declare class PrismaItemRepository implements ItemRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(tenantId: string, itemId: string): Promise<Item | null>;
    findByIds(tenantId: string, itemIds: string[]): Promise<Item[]>;
    findByCode(tenantId: string, itemCode: string): Promise<Item | null>;
    save(item: Item): Promise<Item>;
    search(input: SearchItemsInput): Promise<SearchItemsResult>;
}
