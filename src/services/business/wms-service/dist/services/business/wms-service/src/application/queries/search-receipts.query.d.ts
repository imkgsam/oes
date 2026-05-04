import { SearchReceiptsInput } from '../../domain/models/wms-records';
/** SearchReceiptsQuery captures one paged receipt directory search request. */
export declare class SearchReceiptsQuery {
    readonly payload: SearchReceiptsInput;
    constructor(payload: SearchReceiptsInput);
}
