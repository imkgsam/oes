import { SearchLocationsInput } from '../../domain/models/wms-records';
/** ListLocationsQuery captures one paged internal location directory request. */
export declare class ListLocationsQuery {
    readonly payload: SearchLocationsInput;
    constructor(payload: SearchLocationsInput);
}
