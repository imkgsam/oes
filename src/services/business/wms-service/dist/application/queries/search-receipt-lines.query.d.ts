import { SearchReceiptLinesInput } from '../../domain/models/wms-records';
/** SearchReceiptLinesQuery captures one paged receipt-line directory search request. */
export declare class SearchReceiptLinesQuery {
    readonly payload: SearchReceiptLinesInput;
    constructor(payload: SearchReceiptLinesInput);
}
