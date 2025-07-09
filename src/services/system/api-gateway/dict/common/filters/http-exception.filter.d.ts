import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class HttpExceptionFilter<T> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost): void;
}
