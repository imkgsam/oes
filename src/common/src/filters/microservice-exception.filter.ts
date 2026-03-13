import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Observable, throwError } from 'rxjs'
import { ExceptionPayload } from '../exceptions'
import { ExceptionFactory, OESExceptionBase, UNKNOWN_EXCEPTION } from '../exceptions'

@Catch()
export class MicroserviceExceptionsFilter implements ExceptionFilter {
  constructor(private readonly moduleName = process.env.MODULE_NAME || 'unknown-service') {}

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    const rpcCtx = host.switchToRpc()
    const pattern = rpcCtx.getContext?.()?.pattern ?? 'unknown-pattern'

    if (exception instanceof RpcException) {
      return throwError(() => exception)
    }

    if (exception instanceof OESExceptionBase) {
      return throwError(() => new RpcException(exception.toRpcPayload()))
    }

    const payload: ExceptionPayload = ExceptionFactory.infrastructure(UNKNOWN_EXCEPTION, {
      module: this.moduleName,
      pattern,
      message: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined
    }).toRpcPayload()

    return throwError(() => new RpcException(payload))
  }
}
