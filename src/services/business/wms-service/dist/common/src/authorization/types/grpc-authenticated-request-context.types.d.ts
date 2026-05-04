import { OperatorContextPayload } from './operator-context-payload';
export interface GrpcAuthenticatedRequestContext {
    internalServiceName?: string;
    operatorContext?: OperatorContextPayload;
    requestId?: string;
    traceId?: string;
}
