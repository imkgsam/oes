import { ExceptionDefinition } from '@oes/common/exceptions';
/** SRM_INVALID_ARGUMENT reports request shapes that violate the frozen SRM phase 1 contract. */
export declare const SRM_INVALID_ARGUMENT: ExceptionDefinition;
/** SRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export declare const SRM_UNAUTHENTICATED: ExceptionDefinition;
/** SRM_NOT_FOUND reports missing supplier-profile, contact, address, or tenant-party resources. */
export declare const SRM_NOT_FOUND: ExceptionDefinition;
/** SRM_ALREADY_EXISTS reports duplicate supplier bindings or supplier numbers that violate phase 1 uniqueness. */
export declare const SRM_ALREADY_EXISTS: ExceptionDefinition;
/** SRM_FAILED_PRECONDITION reports valid requests that violate frozen supplier-master invariants. */
export declare const SRM_FAILED_PRECONDITION: ExceptionDefinition;
/** SRM_INTERNAL reports uncategorized internal failures inside the srm-service runtime. */
export declare const SRM_INTERNAL: ExceptionDefinition;
