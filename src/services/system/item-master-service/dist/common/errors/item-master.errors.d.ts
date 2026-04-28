import { ExceptionDefinition } from '@oes/common/exceptions';
/** ITEM_MASTER_INVALID_ARGUMENT reports request shapes that violate the frozen phase 1 contract. */
export declare const ITEM_MASTER_INVALID_ARGUMENT: ExceptionDefinition;
/** ITEM_MASTER_UNAUTHENTICATED reports missing or invalid internal/operator authentication context. */
export declare const ITEM_MASTER_UNAUTHENTICATED: ExceptionDefinition;
/** ITEM_MASTER_PERMISSION_DENIED reports caller contexts that are authenticated but not allowed to proceed. */
export declare const ITEM_MASTER_PERMISSION_DENIED: ExceptionDefinition;
/** ITEM_MASTER_NOT_FOUND reports missing item-master resources. */
export declare const ITEM_MASTER_NOT_FOUND: ExceptionDefinition;
/** ITEM_MASTER_ALREADY_EXISTS reports uniqueness conflicts inside the tenant-scoped item catalog. */
export declare const ITEM_MASTER_ALREADY_EXISTS: ExceptionDefinition;
/** ITEM_MASTER_FAILED_PRECONDITION reports valid requests that violate frozen phase 1 invariants. */
export declare const ITEM_MASTER_FAILED_PRECONDITION: ExceptionDefinition;
/** ITEM_MASTER_UNAVAILABLE reports infrastructure dependencies that are temporarily unavailable. */
export declare const ITEM_MASTER_UNAVAILABLE: ExceptionDefinition;
/** ITEM_MASTER_INTERNAL reports uncategorized internal failures. */
export declare const ITEM_MASTER_INTERNAL: ExceptionDefinition;
