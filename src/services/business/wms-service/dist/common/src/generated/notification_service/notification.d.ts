import { Observable } from "rxjs";
export declare enum DispatchStatus {
    DISPATCH_STATUS_UNSPECIFIED = 0,
    DISPATCH_STATUS_ACCEPTED = 1,
    DISPATCH_STATUS_QUEUED = 2,
    DISPATCH_STATUS_REJECTED = 3
}
export declare enum DispatchPriority {
    DISPATCH_PRIORITY_UNSPECIFIED = 0,
    DISPATCH_PRIORITY_LOW = 1,
    DISPATCH_PRIORITY_NORMAL = 2,
    DISPATCH_PRIORITY_HIGH = 3,
    DISPATCH_PRIORITY_CRITICAL = 4
}
export declare enum NotificationCategory {
    NOTIFICATION_CATEGORY_UNSPECIFIED = 0,
    NOTIFICATION_CATEGORY_AUTH_OTP = 1,
    NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT = 2,
    NOTIFICATION_CATEGORY_WORKFLOW_REMINDER = 3,
    NOTIFICATION_CATEGORY_BUSINESS_STATUS = 4
}
export interface NotificationVariable {
    key?: string | undefined;
    value?: string | undefined;
}
export interface RecipientSnapshot {
    address?: string | undefined;
    displayName?: string | undefined;
}
export interface SourceContext {
    sourceService?: string | undefined;
    tenantId?: string | undefined;
    orgId?: string | undefined;
    traceId?: string | undefined;
    requestId?: string | undefined;
}
export interface SendEmailRequest {
    source?: SourceContext | undefined;
    category?: NotificationCategory | undefined;
    templateKey?: string | undefined;
    recipient?: RecipientSnapshot | undefined;
    variables?: NotificationVariable[] | undefined;
    idempotencyKey?: string | undefined;
    priority?: DispatchPriority | undefined;
    subjectOverride?: string | undefined;
}
export interface SendSmsRequest {
    source?: SourceContext | undefined;
    category?: NotificationCategory | undefined;
    templateKey?: string | undefined;
    recipient?: RecipientSnapshot | undefined;
    variables?: NotificationVariable[] | undefined;
    idempotencyKey?: string | undefined;
    priority?: DispatchPriority | undefined;
}
export interface SendEmailResponse {
    accepted?: boolean | undefined;
    dispatchId?: string | undefined;
    status?: DispatchStatus | undefined;
    rejectionReason?: string | undefined;
}
export interface SendSmsResponse {
    accepted?: boolean | undefined;
    dispatchId?: string | undefined;
    status?: DispatchStatus | undefined;
    rejectionReason?: string | undefined;
}
export interface SendDispatchResponse {
    accepted?: boolean | undefined;
    dispatchId?: string | undefined;
    status?: DispatchStatus | undefined;
    rejectionReason?: string | undefined;
}
export interface NotificationServiceClient {
    sendEmail(request: SendEmailRequest, ...rest: any): Observable<SendEmailResponse>;
    sendSms(request: SendSmsRequest, ...rest: any): Observable<SendSmsResponse>;
}
export interface NotificationServiceController {
    sendEmail(request: SendEmailRequest, ...rest: any): Promise<SendEmailResponse> | Observable<SendEmailResponse> | SendEmailResponse;
    sendSms(request: SendSmsRequest, ...rest: any): Promise<SendSmsResponse> | Observable<SendSmsResponse> | SendSmsResponse;
}
export declare function NotificationServiceControllerMethods(): (constructor: Function) => void;
export declare const NOTIFICATION_SERVICE_NAME = "NotificationService";
