import { status } from '@grpc/grpc-js'
import { OESExceptionBase } from '@oes/common/exceptions'
import { IdentityAuditResult } from '../../application/events/identity-audit.event'

export function classifyAuditResult(error: unknown): IdentityAuditResult {
  if (error instanceof OESExceptionBase) {
    switch (error.getRpcStatus()) {
      case status.INVALID_ARGUMENT:
      case status.NOT_FOUND:
      case status.ALREADY_EXISTS:
      case status.PERMISSION_DENIED:
      case status.UNAUTHENTICATED:
        return 'REJECTED'
      default:
        return 'FAILED'
    }
  }

  return 'FAILED'
}

export function extractAuditErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof OESExceptionBase) {
    return {
      errorCode: error.getCode(),
      errorMessageKey: error.getI18nKey()
    }
  }

  if (error instanceof Error) {
    return {
      errorCode: error.name,
      errorMessage: error.message
    }
  }

  return {
    errorCode: 'UNKNOWN_ERROR'
  }
}
