import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code = 0; // 默认成功码
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    const timestamp = Date.now();
    const path = request.originalUrl;
    const traceId =
      request.headers['x-trace-id']?.toString() || request['traceId'] || '';

    if (exception instanceof RpcException) {
      const error = exception.getError() as any;
      code = error.code ?? 0xFFFFFFFF;
      message = error.message ?? 'Unknown RPC error';
      status = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.message || (exception.getResponse() as any)
    } else if (exception instanceof Error) {
      message = exception.message
    } else {
      console.error('Unhandled exception:', typeof exception, exception);
      if (exception && typeof exception === 'object' && 'message' in exception) {
        message = (exception as any).message;
      } else {
        message = String(exception);
      }
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp,
      path,
      traceId
    })
  }
}
