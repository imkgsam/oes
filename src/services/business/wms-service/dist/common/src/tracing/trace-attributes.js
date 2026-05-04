"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACE_ATTRIBUTE_KEYS = void 0;
exports.filterAllowedTraceAttributes = filterAllowedTraceAttributes;
exports.TRACE_ATTRIBUTE_KEYS = {
    tenantId: 'tenant.id',
    orgId: 'org.id',
    resourceType: 'resource.type',
    resourceId: 'resource.id',
    service: 'service.name',
    module: 'oes.module',
    operation: 'oes.operation'
};
const ALLOWED_TRACE_ATTRIBUTES = new Set(Object.values(exports.TRACE_ATTRIBUTE_KEYS));
function filterAllowedTraceAttributes(attributes) {
    return Object.fromEntries(Object.entries(attributes).filter(([key, value]) => ALLOWED_TRACE_ATTRIBUTES.has(key) && isTraceAttributeValue(value)));
}
function isTraceAttributeValue(value) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
//# sourceMappingURL=trace-attributes.js.map