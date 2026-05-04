export type AuditResult = 'SUCCEEDED' | 'REJECTED' | 'FAILED';
export type AuditOperatorType = 'HUMAN' | 'SYSTEM';
export interface AuditOperator {
    operatorId: string | null;
    operatorType: AuditOperatorType;
}
export interface AuditScope {
    tenantId: string | null;
    orgId: string | null;
}
export interface AuditTrace {
    traceId: string | null;
}
export interface AuditResource {
    resourceType: string;
    resourceId: string | null;
}
export interface AuditEnvelope<TService extends string = string, TModule extends string = string, TEventType extends string = string, TDetails extends Record<string, unknown> = Record<string, unknown>> {
    eventId: string;
    service: TService;
    module: TModule;
    eventType: TEventType;
    occurredAt: Date;
    result: AuditResult;
    operator: AuditOperator;
    scope: AuditScope;
    trace: AuditTrace;
    resource: AuditResource;
    details: TDetails;
}
export interface BuildAuditEnvelopeInput<TService extends string, TModule extends string, TEventType extends string, TDetails extends Record<string, unknown>> {
    eventId?: string;
    service: TService;
    module: TModule;
    eventType: TEventType;
    occurredAt?: Date;
    result?: AuditResult;
    operator: AuditOperator;
    scope: AuditScope;
    trace: AuditTrace;
    resource: AuditResource;
    details: TDetails;
}
export declare function buildAuditEnvelope<TService extends string, TModule extends string, TEventType extends string, TDetails extends Record<string, unknown>>(input: BuildAuditEnvelopeInput<TService, TModule, TEventType, TDetails>): AuditEnvelope<TService, TModule, TEventType, TDetails>;
export interface FlatAuditEnvelopeRecord {
    eventId: string;
    service: string;
    module: string;
    eventType: string;
    occurredAt: Date;
    result: AuditResult;
    operatorId: string | null;
    operatorType: AuditOperatorType;
    tenantId: string | null;
    orgId: string | null;
    traceId: string | null;
    resourceType: string;
    resourceId: string | null;
    details: Record<string, unknown>;
}
export declare function flattenAuditEnvelope(envelope: AuditEnvelope<string, string, string, Record<string, unknown>>): FlatAuditEnvelopeRecord;
