"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatchMapper = void 0;
const notification_dispatch_aggregate_1 = require("../../domain/aggregates/notification-dispatch.aggregate");
class NotificationDispatchMapper {
    static toDomain(record) {
        return new notification_dispatch_aggregate_1.NotificationDispatch({
            id: record.id,
            channel: record.channel,
            category: record.category,
            sourceService: record.sourceService,
            tenantId: record.tenantId,
            orgId: record.orgId ?? undefined,
            traceId: record.traceId ?? undefined,
            requestId: record.requestId ?? undefined,
            recipientAddress: record.recipientAddress,
            recipientDisplayName: record.recipientDisplayName ?? undefined,
            templateKey: record.templateKey,
            variablePayload: record.variablePayload ?? {},
            idempotencyKey: record.idempotencyKey,
            status: record.status,
            rejectionReason: record.rejectionReason ?? undefined,
            subjectOverride: record.subjectOverride ?? undefined,
            providerRoute: record.providerRoute ?? undefined,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            acceptedAt: record.acceptedAt ?? undefined
        });
    }
    static toPersistence(dispatch) {
        const props = dispatch.getProps();
        return {
            id: props.id,
            channel: props.channel,
            category: props.category,
            sourceService: props.sourceService,
            tenantId: props.tenantId,
            orgId: props.orgId ?? null,
            traceId: props.traceId ?? null,
            requestId: props.requestId ?? null,
            recipientAddress: props.recipientAddress,
            recipientDisplayName: props.recipientDisplayName ?? null,
            templateKey: props.templateKey,
            variablePayload: props.variablePayload,
            idempotencyKey: props.idempotencyKey,
            status: props.status,
            rejectionReason: props.rejectionReason ?? null,
            subjectOverride: props.subjectOverride ?? null,
            providerRoute: props.providerRoute ?? null,
            acceptedAt: props.acceptedAt ?? null
        };
    }
}
exports.NotificationDispatchMapper = NotificationDispatchMapper;
//# sourceMappingURL=notification-dispatch.mapper.js.map