"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuditEnvelope = buildAuditEnvelope;
exports.flattenAuditEnvelope = flattenAuditEnvelope;
const node_crypto_1 = require("node:crypto");
function buildAuditEnvelope(input) {
    return {
        eventId: input.eventId ?? (0, node_crypto_1.randomUUID)(),
        service: input.service,
        module: input.module,
        eventType: input.eventType,
        occurredAt: input.occurredAt ?? new Date(),
        result: input.result ?? 'SUCCEEDED',
        operator: input.operator,
        scope: input.scope,
        trace: input.trace,
        resource: input.resource,
        details: input.details
    };
}
function flattenAuditEnvelope(envelope) {
    return {
        eventId: envelope.eventId,
        service: envelope.service,
        module: envelope.module,
        eventType: envelope.eventType,
        occurredAt: envelope.occurredAt,
        result: envelope.result,
        operatorId: envelope.operator.operatorId,
        operatorType: envelope.operator.operatorType,
        tenantId: envelope.scope.tenantId,
        orgId: envelope.scope.orgId,
        traceId: envelope.trace.traceId,
        resourceType: envelope.resource.resourceType,
        resourceId: envelope.resource.resourceId,
        details: envelope.details
    };
}
//# sourceMappingURL=audit-envelope.js.map