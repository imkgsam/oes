import { ItemCapabilities } from '../../domain/value-objects/item.value-objects';
/** SetItemCapabilitiesCommand captures the full replacement capability payload. */
export declare class SetItemCapabilitiesCommand {
    readonly input: {
        tenantId: string;
        itemId: string;
        capabilities: ItemCapabilities;
    };
    constructor(input: {
        tenantId: string;
        itemId: string;
        capabilities: ItemCapabilities;
    });
    get tenantId(): string;
    get itemId(): string;
    get capabilities(): ItemCapabilities;
}
