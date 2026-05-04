import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GrpcRequestContextStore } from '../services/grpc-request-context.store';
export declare class GrpcRequestContextInterceptor implements NestInterceptor {
    private readonly requestContextStore;
    constructor(requestContextStore: GrpcRequestContextStore);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
