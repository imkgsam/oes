"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDispatch = void 0;
const crypto_1 = require("crypto");
class NotificationDispatch {
    constructor(props) {
        this.props = props;
    }
    static accept(input) {
        const now = new Date();
        return new NotificationDispatch({
            id: (0, crypto_1.randomUUID)(),
            channel: input.channel,
            category: input.category,
            sourceService: input.sourceService,
            tenantId: input.tenantId,
            orgId: input.orgId,
            traceId: input.traceId,
            requestId: input.requestId,
            recipientAddress: input.recipientAddress,
            recipientDisplayName: input.recipientDisplayName,
            templateKey: input.templateKey,
            variablePayload: input.variablePayload,
            idempotencyKey: input.idempotencyKey,
            status: 'ACCEPTED',
            subjectOverride: input.subjectOverride,
            providerRoute: input.providerRoute,
            createdAt: now,
            updatedAt: now,
            acceptedAt: now
        });
    }
    getProps() {
        return { ...this.props };
    }
}
exports.NotificationDispatch = NotificationDispatch;
//# sourceMappingURL=notification-dispatch.aggregate.js.map