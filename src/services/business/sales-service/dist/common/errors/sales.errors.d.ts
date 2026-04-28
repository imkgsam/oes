import { ExceptionDefinition } from '@oes/common/exceptions';
/** SALES_INVALID_ARGUMENT reports request shapes that violate the frozen sales phase 1 contract. */
export declare const SALES_INVALID_ARGUMENT: ExceptionDefinition;
/** SALES_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export declare const SALES_UNAUTHENTICATED: ExceptionDefinition;
/** SALES_PERMISSION_DENIED reports caller contexts that are present but not allowed to continue. */
export declare const SALES_PERMISSION_DENIED: ExceptionDefinition;
/** SALES_NOT_FOUND reports missing quote, quote version, or sales order resources. */
export declare const SALES_NOT_FOUND: ExceptionDefinition;
/** SALES_ALREADY_EXISTS reports one-to-one conflicts such as repeated conversion from the same quote version. */
export declare const SALES_ALREADY_EXISTS: ExceptionDefinition;
/** SALES_FAILED_PRECONDITION reports valid requests that violate frozen quote, order, or handoff invariants. */
export declare const SALES_FAILED_PRECONDITION: ExceptionDefinition;
/** SALES_INTERNAL reports uncategorized internal failures inside the sales runtime skeleton. */
export declare const SALES_INTERNAL: ExceptionDefinition;
