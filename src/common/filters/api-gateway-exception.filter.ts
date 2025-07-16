// src/common/filters/all-http-exceptions.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { GLOBAL_SYSTEM_ERRORS } from '../constants/res-codes/system.errors'

@Catch()
export class ApiGatewayExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let responseBody = {
      code: GLOBAL_SYSTEM_ERRORS.INTERNAL_SERVER_ERROR.code,
      message: GLOBAL_SYSTEM_ERRORS.INTERNAL_SERVER_ERROR.message,
      messageKey: GLOBAL_SYSTEM_ERRORS.INTERNAL_SERVER_ERROR.messageKey,
      details: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    // ✅ HttpException（如参数校验失败等）
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()

      if (typeof res === 'string') {
        responseBody.message = res
      } else if (typeof res === 'object' && res !== null) {
        responseBody = {
          ...responseBody,
          ...res,
          timestamp: new Date().toISOString(),
          path: request.url,
        }
      }
    }

    // ✅ RpcException（来自微服务 BusinessException / SystemException）
    else if (exception instanceof RpcException) {
      const err = exception.getError?.()

      if (typeof err === 'object' && err !== null) {
        const errorObject = err as {
          code?: string
          message?: string
          module?: string
          messageKey?: string
          httpStatus?: number
          details?: any
        }
        responseBody = {
          code: errorObject.code ?? responseBody.code,
          message: errorObject.message ?? responseBody.message,
          messageKey: errorObject.messageKey ?? responseBody.messageKey,
          details: errorObject.details ?? null,
          timestamp: new Date().toISOString(),
          path: request.url,
        }

        status = errorObject.httpStatus ?? HttpStatus.BAD_GATEWAY
      } else {
        // fallback，可能是字符串或其他类型
        responseBody.message =
          typeof err === 'string' ? err : responseBody.message
        status = HttpStatus.BAD_GATEWAY
      }
    }

    // ✅ 一般 Error
    else if (exception instanceof Error) {
      responseBody.message = exception.message
    }

    response.status(status).json(responseBody)
  }
}
