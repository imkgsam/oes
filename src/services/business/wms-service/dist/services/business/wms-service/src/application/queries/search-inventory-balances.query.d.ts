import { SearchInventoryBalancesInput } from '../../domain/models/wms-records';
/** SearchInventoryBalancesQuery captures one paged inventory balance directory request. */
export declare class SearchInventoryBalancesQuery {
    readonly payload: SearchInventoryBalancesInput;
    constructor(payload: SearchInventoryBalancesInput);
}
