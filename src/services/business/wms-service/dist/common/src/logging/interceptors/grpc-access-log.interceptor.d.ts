import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLogger } from '../app-logger.service';
/**
 * GrpcAccessLogInterceptor records a unified access log entry for every inbound gRPC request.
 */
export declare class GrpcAccessLogInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: AppLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private getMethodName;
    private extractErrorCode;
}
