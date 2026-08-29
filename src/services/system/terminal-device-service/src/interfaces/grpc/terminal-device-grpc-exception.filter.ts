import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common'
import { status } from '@grpc/grpc-js'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { AppLogger } from '@oes/common/logging'
import { Observable, throwError } from 'rxjs'
import {
  TerminalDeviceError,
  TerminalDeviceErrorCode
} from '../../domain/errors/terminal-device.error'

/** Maps Terminal Device domain failures into the standardized OES gRPC error envelope. */
@Catch()
@Injectable()
export class TerminalDeviceGrpcExceptionFilter implements ExceptionFilter {
  private readonly fallback: GrpcExceptionFilter

  constructor(private readonly logger: AppLogger) {
    this.fallback = new GrpcExceptionFilter(logger)
  }

  catch(exception: unknown, host: ArgumentsHost): Observable<never> {
    if (!(exception instanceof TerminalDeviceError)) {
      return this.fallback.catch(exception, host)
    }

    const payload = {
      grpcStatus: grpcStatusFor(exception.code),
      code: exception.code,
      message: exception.message,
      messageKey: `terminal_device.${exception.code.toLowerCase()}`,
      details: { reasonCode: exception.code }
    }
    this.logger.warn('Terminal Device domain exception', {
      module: process.env.MODULE_NAME || 'terminal-device-service',
      operation: 'grpc.request',
      errorCode: exception.code,
      details: payload.details
    })
    return throwError(() => ({
      code: payload.grpcStatus,
      details: JSON.stringify(payload),
      message: payload.message
    }))
  }
}

/** Selects the transport status without leaking domain mapping into application services. */
function grpcStatusFor(code: TerminalDeviceErrorCode): status {
  switch (code) {
    case 'TERMINAL_DEVICE_CREDENTIAL_INVALID':
      return status.UNAUTHENTICATED
    case 'ENROLLMENT_NOT_FOUND':
    case 'TERMINAL_DEVICE_NOT_FOUND':
      return status.NOT_FOUND
    case 'ENROLLMENT_ACTIVATION_CONFLICT':
    case 'TERMINAL_DEVICE_ALREADY_EXISTS':
    case 'TERMINAL_DEVICE_ENROLLMENT_ALREADY_LINKED':
    case 'AUDIT_EVENT_ALREADY_EXISTS':
      return status.ALREADY_EXISTS
    case 'UNSUPPORTED_TERMINAL_DEVICE_TYPE':
    case 'ENROLLMENT_EXPIRATION_NOT_FUTURE':
    case 'ENROLLMENT_REVOCATION_REASON_REQUIRED':
    case 'TERMINAL_DEVICE_STATUS_REASON_REQUIRED':
    case 'TERMINAL_DEVICE_VERSION_POLICY_REASON_REQUIRED':
      return status.INVALID_ARGUMENT
    case 'TERMINAL_DEVICE_PERSISTENCE_ERROR':
      return status.INTERNAL
    default:
      return status.FAILED_PRECONDITION
  }
}
