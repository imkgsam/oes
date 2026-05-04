export declare const TRACE_ATTRIBUTE_KEYS: {
    readonly tenantId: "tenant.id";
    readonly orgId: "org.id";
    readonly resourceType: "resource.type";
    readonly resourceId: "resource.id";
    readonly service: "service.name";
    readonly module: "oes.module";
    readonly operation: "oes.operation";
};
type TraceAttributeValue = string | number | boolean;
export declare function filterAllowedTraceAttributes(attributes: Record<string, unknown>): Record<string, TraceAttributeValue>;
export {};
