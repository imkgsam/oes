/** SetItemCompositionCommand captures the full replacement component list for one bundle parent. */
export declare class SetItemCompositionCommand {
    readonly input: {
        tenantId: string;
        itemId: string;
        componentItemIds: string[];
    };
    constructor(input: {
        tenantId: string;
        itemId: string;
        componentItemIds: string[];
    });
    get tenantId(): string;
    get itemId(): string;
    get componentItemIds(): string[];
}
