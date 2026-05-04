import { status } from '@grpc/grpc-js';
import { HttpStatus } from '@nestjs/common';
export interface ExceptionDefinition {
    code: string;
    message: string;
    rpcStatus: status;
    messageKey?: string;
    httpStatus?: HttpStatus;
}
export interface RpcMappableException {
    toRpcPayload(): RpcExceptionPayload;
}
export interface HttpMappableException {
    toHttpPayload(): HttpExceptionPayload;
}
export interface RpcExceptionPayload {
    grpcStatus: status;
    code: string;
    message: string;
    messageKey?: string;
    details?: Record<string, any>;
    meta?: {
        service?: string;
        timestamp?: string;
        traceId?: string;
    };
}
export interface HttpExceptionPayload {
    code: string;
    message: string;
    messageKey?: string;
    details?: Record<string, any>;
    meta?: {
        service?: string;
        timestamp?: string;
        traceId?: string;
        requestId?: string;
    };
}
