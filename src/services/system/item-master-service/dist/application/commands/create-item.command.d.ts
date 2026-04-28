import { ItemNatureType, ItemStructureType } from '../../domain/value-objects/item.value-objects';
/** CreateItemCommand captures the full phase 1 item creation intent. */
export declare class CreateItemCommand {
    readonly input: {
        tenantId: string;
        itemCode: string;
        itemName: string;
        structureType: ItemStructureType;
        natureType: ItemNatureType;
    };
    constructor(input: {
        tenantId: string;
        itemCode: string;
        itemName: string;
        structureType: ItemStructureType;
        natureType: ItemNatureType;
    });
    get tenantId(): string;
    get itemCode(): string;
    get itemName(): string;
    get structureType(): ItemStructureType;
    get natureType(): ItemNatureType;
}
