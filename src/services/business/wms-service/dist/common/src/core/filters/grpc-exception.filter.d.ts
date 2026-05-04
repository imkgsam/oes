import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { AppLogger } from '../../logging/app-logger.service';
import { Observable } from 'rxjs';
export declare class GrpcExceptionFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: AppLogger);
    catch(exception: unknown, host: ArgumentsHost): Observable<never>;
    private toGrpcTransportError;
    private getMethodName;
    private normalizeRpcPayload;
    private mapHttpException;
    private httpStatusToGrpcStatus;
    private defaultHttpExceptionCode;
}
