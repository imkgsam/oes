import { ExceptionDefinition } from '@oes/common/exceptions';
/** PROCUREMENT_INVALID_ARGUMENT reports request shapes that violate the frozen procurement phase 1 contract. */
export declare const PROCUREMENT_INVALID_ARGUMENT: ExceptionDefinition;
/** PROCUREMENT_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export declare const PROCUREMENT_UNAUTHENTICATED: ExceptionDefinition;
/** PROCUREMENT_NOT_FOUND reports missing purchase request, purchase order, receiving, item, or supplier resources. */
export declare const PROCUREMENT_NOT_FOUND: ExceptionDefinition;
/** PROCUREMENT_ALREADY_EXISTS reports uniqueness conflicts on procurement-owned facts. */
export declare const PROCUREMENT_ALREADY_EXISTS: ExceptionDefinition;
/** PROCUREMENT_FAILED_PRECONDITION reports valid requests that violate frozen PR PO foundation invariants. */
export declare const PROCUREMENT_FAILED_PRECONDITION: ExceptionDefinition;
/** PROCUREMENT_INTERNAL reports uncategorized internal failures inside the procurement-service runtime. */
export declare const PROCUREMENT_INTERNAL: ExceptionDefinition;
