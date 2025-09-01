import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class ApiGatewayExceptionsFilter implements ExceptionFilter {
    private readonly moduleName;
    private readonly logger;
    constructor(moduleName?: string);
    catch(exception: unknown, host: ArgumentsHost): void;
    private buildDefaultResponse;
    private handleHttpException;
    private handleRpcException;
    private handleGenericError;
}
