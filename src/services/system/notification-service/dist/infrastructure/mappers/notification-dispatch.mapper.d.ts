import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate';
type PrismaNotificationDispatchRecord = {
    id: string;
    channel: 'EMAIL' | 'SMS';
    category: 'AUTH_OTP' | 'AUTH_SECURITY_ALERT' | 'WORKFLOW_REMINDER' | 'BUSINESS_STATUS';
    sourceService: string;
    tenantId: string;
    orgId: string | null;
    traceId: string | null;
    requestId: string | null;
    recipientAddress: string;
    recipientDisplayName: string | null;
    templateKey: string;
    variablePayload: unknown;
    idempotencyKey: string;
    status: 'ACCEPTED' | 'QUEUED' | 'REJECTED';
    rejectionReason: string | null;
    subjectOverride: string | null;
    providerRoute: string | null;
    createdAt: Date;
    updatedAt: Date;
    acceptedAt: Date | null;
};
export declare class NotificationDispatchMapper {
    static toDomain(record: PrismaNotificationDispatchRecord): NotificationDispatch;
    static toPersistence(dispatch: NotificationDispatch): {
        id: string;
        channel: import("../../domain/aggregates/notification-dispatch.aggregate").NotificationChannel;
        category: import("../../domain/aggregates/notification-dispatch.aggregate").NotificationCategory;
        sourceService: string;
        tenantId: string;
        orgId: string;
        traceId: string;
        requestId: string;
        recipientAddress: string;
        recipientDisplayName: string;
        templateKey: string;
        variablePayload: Record<string, string>;
        idempotencyKey: string;
        status: import("../../domain/aggregates/notification-dispatch.aggregate").NotificationDispatchStatus;
        rejectionReason: string;
        subjectOverride: string;
        providerRoute: string;
        acceptedAt: Date;
    };
}
export {};
