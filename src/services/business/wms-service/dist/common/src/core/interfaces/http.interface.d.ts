export interface HttpResponse<T = any> {
    code: string;
    message: string;
    messageKey?: string;
    data?: T;
    details?: any;
    meta?: {
        traceId?: string;
        requestId?: string;
        timestamp?: string;
    };
}
export interface HttpRequest<T = any> {
    code: string;
    message: string;
    messageKey?: string;
    data?: T;
    details?: any;
    meta?: {
        traceId?: string;
        requestId?: string;
        timestamp?: string;
    };
}
export interface HttpControllerResult<T = unknown> {
    data?: T;
}
