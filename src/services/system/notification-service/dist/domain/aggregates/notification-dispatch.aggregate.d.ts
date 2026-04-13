export type NotificationChannel = 'EMAIL' | 'SMS';
export type NotificationCategory = 'AUTH_OTP' | 'AUTH_SECURITY_ALERT' | 'WORKFLOW_REMINDER' | 'BUSINESS_STATUS';
export type NotificationDispatchStatus = 'ACCEPTED' | 'QUEUED' | 'REJECTED';
export interface NotificationDispatchProps {
    id: string;
    channel: NotificationChannel;
    category: NotificationCategory;
    sourceService: string;
    tenantId: string;
    orgId?: string;
    traceId?: string;
    requestId?: string;
    recipientAddress: string;
    recipientDisplayName?: string;
    templateKey: string;
    variablePayload: Record<string, string>;
    idempotencyKey: string;
    status: NotificationDispatchStatus;
    rejectionReason?: string;
    subjectOverride?: string;
    providerRoute?: string;
    createdAt: Date;
    updatedAt: Date;
    acceptedAt?: Date;
}
export declare class NotificationDispatch {
    private readonly props;
    constructor(props: NotificationDispatchProps);
    static accept(input: {
        channel: NotificationChannel;
        category: NotificationCategory;
        sourceService: string;
        tenantId: string;
        orgId?: string;
        traceId?: string;
        requestId?: string;
        recipientAddress: string;
        recipientDisplayName?: string;
        templateKey: string;
        variablePayload: Record<string, string>;
        idempotencyKey: string;
        subjectOverride?: string;
        providerRoute?: string;
    }): NotificationDispatch;
    getProps(): NotificationDispatchProps;
}
