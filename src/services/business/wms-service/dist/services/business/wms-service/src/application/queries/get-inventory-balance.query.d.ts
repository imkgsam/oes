import { GetInventoryBalanceInput } from '../../domain/models/wms-records';
/** GetInventoryBalanceQuery captures one warehouse-level or location-level balance lookup key. */
export declare class GetInventoryBalanceQuery {
    readonly payload: GetInventoryBalanceInput;
    constructor(payload: GetInventoryBalanceInput);
}
