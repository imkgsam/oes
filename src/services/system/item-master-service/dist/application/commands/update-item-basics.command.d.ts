import { ItemNatureType, ItemStructureType } from '../../domain/value-objects/item.value-objects';
/** UpdateItemBasicsCommand captures the only mutable phase 1 basic fields plus raw extras for contract rejection. */
export declare class UpdateItemBasicsCommand {
    readonly input: {
        tenantId: string;
        itemId: string;
        itemCode: string;
        itemName: string;
        structureType?: ItemStructureType;
        natureType?: ItemNatureType;
    };
    constructor(input: {
        tenantId: string;
        itemId: string;
        itemCode: string;
        itemName: string;
        structureType?: ItemStructureType;
        natureType?: ItemNatureType;
    });
    get tenantId(): string;
    get itemId(): string;
    get itemCode(): string;
    get itemName(): string;
    get structureType(): ItemStructureType | undefined;
    get natureType(): ItemNatureType | undefined;
}
