import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { OESException } from '../exceptions/oes.exception';
import { SYSTEM_EXCEPTIONS } from '../../constants/exceptions/system.exceptions';
@Catch()
export class OesUnifiedFilter implements ExceptionFilter {
  private readonly logger = new Logger(OesUnifiedFilter.name);

  catch(exception: any, host: ArgumentsHost): any {
    const protocolType = host.getType(); // 获取协议类型
    
    // 1. 构造标准错误信息
    const errorDetails = this.parseError(exception, host);

    // 2. 根据协议分发
    if (protocolType === 'http') {
      return this.handleHttp(host, errorDetails, exception);
    } else if (protocolType === 'rpc') {
      return this.handleRpc(errorDetails, exception);
    } else if (protocolType === 'ws') {
      return this.handleWs(host, errorDetails);
    }
  }

  /**
   * 解析异常详情
   */
  private parseError(exception: any, host: ArgumentsHost) {
    let code = SYSTEM_EXCEPTIONS.UNKNOWN_ERROR.subCode;
    let message = '系统繁忙，请稍后再试';

    // 区分处理 自定义exceptiion
    if (exception instanceof OESException) {
      code = exception.getErrorCode();
      message = exception.message;
    } 
    // 处理 NestJS 内置 HttpException (如 404, 403)
    else if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      code = `HTTP_${exception.getStatus()}`;
      message = typeof res === 'object' ? res.message : res;
    }
    // 处理超时错误
    else if (exception.name === 'TimeoutError') {
      code = 'SYS_TIMEOUT';
      message = '服务响应超时';
    }

    return {
      code,
      message,
      timestamp: new Date().toISOString(),
      serviceId: process.env.SERVICE_NAME || 'OES-SERVICE',
    };
  }

  private handleHttp(host: ArgumentsHost, error: any, exception: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // 记录错误日志
    this.logger.error(`[HTTP Error] ${request.method} ${request.url} - ${error.code}: ${error.message}`);

    return response.status(status).json({
      success: false,
      error: { ...error, path: request.url },
    });
  }

  private handleRpc(error: any, exception: any): Observable<any> {
    this.logger.warn(`[RPC Error] ${error.code}: ${error.message}`);
    // 必须返回 Observable 给 NestJS 传输层
    return throwError(() => error);
  }

  private handleWs(host: ArgumentsHost, error: any) {
    const client = host.switchToWs().getClient();
    this.logger.warn(`[WS Error] ${error.code}: ${error.message}`);
    // 触发客户端的 exception 事件
    client.emit('exception', { success: false, error });
  }
}