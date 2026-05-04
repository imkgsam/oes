import { SearchWarehousesInput } from '../../domain/models/wms-records';
/** ListWarehousesQuery captures one paged internal warehouse directory request. */
export declare class ListWarehousesQuery {
    readonly payload: SearchWarehousesInput;
    constructor(payload: SearchWarehousesInput);
}
