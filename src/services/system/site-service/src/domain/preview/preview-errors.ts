import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'
import { SignedSiteRequestErrorCode } from '../security/site-request-signing'

export type PreviewTokenErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_RESOURCE_MISMATCH'

/** SIGNED_SITE_REQUEST_ERROR_DEFINITIONS preserves stable Site security errors without transport details. */
export const SIGNED_SITE_REQUEST_ERROR_DEFINITIONS: Readonly<
  Record<SignedSiteRequestErrorCode, ExceptionDefinition>
> = {
  AUTH_MISSING: {
    code: 'AUTH_MISSING',
    message: 'Signed Site request authentication is missing',
    rpcStatus: status.UNAUTHENTICATED
  },
  CREDENTIAL_REVOKED: {
    code: 'CREDENTIAL_REVOKED',
    message: 'Site credential has been revoked',
    rpcStatus: status.PERMISSION_DENIED
  },
  NONCE_REPLAYED: {
    code: 'NONCE_REPLAYED',
    message: 'Signed Site request nonce was already used',
    rpcStatus: status.UNAUTHENTICATED
  },
  SCOPE_INSUFFICIENT: {
    code: 'SCOPE_INSUFFICIENT',
    message: 'Site credential scope is insufficient',
    rpcStatus: status.PERMISSION_DENIED
  },
  SIGNATURE_INVALID: {
    code: 'SIGNATURE_INVALID',
    message: 'Signed Site request signature is invalid',
    rpcStatus: status.UNAUTHENTICATED
  },
  SITE_DISABLED: {
    code: 'SITE_DISABLED',
    message: 'Site is not active',
    rpcStatus: status.PERMISSION_DENIED
  },
  TIMESTAMP_EXPIRED: {
    code: 'TIMESTAMP_EXPIRED',
    message: 'Signed Site request timestamp is outside the allowed window',
    rpcStatus: status.UNAUTHENTICATED
  }
}

/** PREVIEW_TOKEN_ERROR_DEFINITIONS preserves stable preview token failures without token data. */
export const PREVIEW_TOKEN_ERROR_DEFINITIONS: Readonly<
  Record<PreviewTokenErrorCode, ExceptionDefinition>
> = {
  TOKEN_INVALID: {
    code: 'TOKEN_INVALID',
    message: 'Preview token is invalid',
    rpcStatus: status.UNAUTHENTICATED
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Preview token has expired',
    rpcStatus: status.UNAUTHENTICATED
  },
  TOKEN_RESOURCE_MISMATCH: {
    code: 'TOKEN_RESOURCE_MISMATCH',
    message: 'Preview token does not authorize the requested resource',
    rpcStatus: status.PERMISSION_DENIED
  }
}

/** PREVIEW_DRAFT_NOT_FOUND hides whether an exact draft miss was foreign, mistyped, or absent. */
export const PREVIEW_DRAFT_NOT_FOUND: ExceptionDefinition = {
  code: 'DRAFT_NOT_FOUND',
  message: 'Preview draft was not found',
  rpcStatus: status.NOT_FOUND
}
