import { ExceptionDefinition } from '@oes/common/exceptions';
/** WMS_INVALID_ARGUMENT reports request shapes that violate the frozen WMS phase 1 contract. */
export declare const WMS_INVALID_ARGUMENT: ExceptionDefinition;
/** WMS_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export declare const WMS_UNAUTHENTICATED: ExceptionDefinition;
/** WMS_PERMISSION_DENIED reports authenticated calls that are outside the allowed WMS phase 1 scope. */
export declare const WMS_PERMISSION_DENIED: ExceptionDefinition;
/** WMS_NOT_FOUND reports missing WMS-owned records or required downstream references. */
export declare const WMS_NOT_FOUND: ExceptionDefinition;
/** WMS_ALREADY_EXISTS reports uniqueness conflicts on WMS-owned facts. */
export declare const WMS_ALREADY_EXISTS: ExceptionDefinition;
/** WMS_FAILED_PRECONDITION reports valid requests that violate frozen WMS state or boundary invariants. */
export declare const WMS_FAILED_PRECONDITION: ExceptionDefinition;
/** WMS_UNAVAILABLE reports temporarily unreachable downstream or infrastructure dependencies. */
export declare const WMS_UNAVAILABLE: ExceptionDefinition;
/** WMS_INTERNAL reports uncategorized internal failures inside the wms-service runtime. */
export declare const WMS_INTERNAL: ExceptionDefinition;
