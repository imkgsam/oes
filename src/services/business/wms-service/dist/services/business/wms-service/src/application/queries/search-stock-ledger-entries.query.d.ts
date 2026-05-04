import { SearchStockLedgerEntriesInput } from '../../domain/models/wms-records';
/** SearchStockLedgerEntriesQuery captures one paged immutable ledger search request. */
export declare class SearchStockLedgerEntriesQuery {
    readonly payload: SearchStockLedgerEntriesInput;
    constructor(payload: SearchStockLedgerEntriesInput);
}
