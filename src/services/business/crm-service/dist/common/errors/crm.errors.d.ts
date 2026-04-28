import { ExceptionDefinition } from '@oes/common/exceptions';
/** CRM_INVALID_ARGUMENT reports request shapes that violate the frozen CRM phase 1 contract. */
export declare const CRM_INVALID_ARGUMENT: ExceptionDefinition;
/** CRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export declare const CRM_UNAUTHENTICATED: ExceptionDefinition;
/** CRM_NOT_FOUND reports missing customer-account, contact, address, or tenant-party resources. */
export declare const CRM_NOT_FOUND: ExceptionDefinition;
/** CRM_ALREADY_EXISTS reports one-to-one binding conflicts for active customer accounts. */
export declare const CRM_ALREADY_EXISTS: ExceptionDefinition;
/** CRM_FAILED_PRECONDITION reports valid requests that violate frozen customer-master invariants. */
export declare const CRM_FAILED_PRECONDITION: ExceptionDefinition;
/** CRM_INTERNAL reports uncategorized internal failures inside the crm-service runtime. */
export declare const CRM_INTERNAL: ExceptionDefinition;
