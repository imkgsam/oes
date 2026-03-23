import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const AUTH_OTP_EXPIRED: ExceptionDefinition = {
  code: 'AUTH_OTP_EXPIRED',
  message: 'OTP has expired',
  messageKey: 'auth.otp_expired',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_OTP_REACH_LIMIT: ExceptionDefinition = {
  code: 'AUTH_OTP_REACH_LIMIT',
  message: 'OTP attempt limit reached',
  messageKey: 'auth.otp_reach_limit',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_OTP_SEND_RATE_LIMITED: ExceptionDefinition = {
  code: 'AUTH_OTP_SEND_RATE_LIMITED',
  message: 'OTP send rate limited',
  messageKey: 'auth.otp_send_rate_limited',
  rpcStatus: status.RESOURCE_EXHAUSTED
}

export const AUTH_OTP_INVALID: ExceptionDefinition = {
  code: 'AUTH_OTP_INVALID',
  message: 'OTP is invalid',
  messageKey: 'auth.otp_invalid',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_MFA_TYPE_MISMATCH: ExceptionDefinition = {
  code: 'AUTH_MFA_TYPE_MISMATCH',
  message: 'MFA type mismatch',
  messageKey: 'auth.mfa_type_mismatch',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_MFA_DISABLED: ExceptionDefinition = {
  code: 'AUTH_MFA_DISABLED',
  message: 'MFA binding is disabled',
  messageKey: 'auth.mfa_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_MFA_TYPE_NOT_SUPPORTED: ExceptionDefinition = {
  code: 'AUTH_MFA_TYPE_NOT_SUPPORTED',
  message: 'MFA type is not supported',
  messageKey: 'auth.mfa_type_not_supported',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_MFA_OTP_TOKEN_REQUIRED: ExceptionDefinition = {
  code: 'AUTH_MFA_OTP_TOKEN_REQUIRED',
  message: 'OTP token is required for MFA verification',
  messageKey: 'auth.mfa_otp_token_required',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_MFA_BINDING_NOT_FOUND: ExceptionDefinition = {
  code: 'AUTH_MFA_BINDING_NOT_FOUND',
  message: 'MFA binding was not found',
  messageKey: 'auth.mfa_binding_not_found',
  rpcStatus: status.NOT_FOUND
}

export const AUTH_MFA_BINDING_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'AUTH_MFA_BINDING_ALREADY_EXISTS',
  message: 'MFA binding already exists',
  messageKey: 'auth.mfa_binding_already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

export const AUTH_INVALID_CREDENTIALS: ExceptionDefinition = {
  code: 'AUTH_INVALID_CREDENTIALS',
  message: 'Invalid credentials',
  messageKey: 'auth.invalid_credentials',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_LOGIN_TEMPORARILY_LOCKED: ExceptionDefinition = {
  code: 'AUTH_LOGIN_TEMPORARILY_LOCKED',
  message: 'Login is temporarily locked due to repeated failures',
  messageKey: 'auth.login_temporarily_locked',
  rpcStatus: status.RESOURCE_EXHAUSTED
}

export const AUTH_LOGIN_FLOW_PROTO_NOT_SUPPORTED: ExceptionDefinition = {
  code: 'AUTH_LOGIN_FLOW_PROTO_NOT_SUPPORTED',
  message: 'Current auth proto does not support this login flow result',
  messageKey: 'auth.login_flow_proto_not_supported',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED: ExceptionDefinition = {
  code: 'AUTH_LOGIN_FLOW_RESULT_UNSUPPORTED',
  message: 'Unsupported login flow result mapping',
  messageKey: 'auth.login_flow_result_unsupported',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_NO_AVAILABLE_ACCOUNT: ExceptionDefinition = {
  code: 'AUTH_NO_AVAILABLE_ACCOUNT',
  message: 'No available account for this user',
  messageKey: 'auth.no_available_account',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_IDENTITY_UPSTREAM_UNAVAILABLE: ExceptionDefinition = {
  code: 'AUTH_IDENTITY_UPSTREAM_UNAVAILABLE',
  message: 'Identity upstream is unavailable for account resolution',
  messageKey: 'auth.identity_upstream_unavailable',
  rpcStatus: status.UNAVAILABLE
}

export const AUTH_ACCOUNT_NOT_FOUND: ExceptionDefinition = {
  code: 'AUTH_ACCOUNT_NOT_FOUND',
  message: 'Account was not found',
  messageKey: 'auth.account_not_found',
  rpcStatus: status.NOT_FOUND
}

export const AUTH_ACCOUNT_OWNER_MISMATCH: ExceptionDefinition = {
  code: 'AUTH_ACCOUNT_OWNER_MISMATCH',
  message: 'Account does not belong to the current user',
  messageKey: 'auth.account_owner_mismatch',
  rpcStatus: status.PERMISSION_DENIED
}

export const AUTH_ACCOUNT_DISABLED: ExceptionDefinition = {
  code: 'AUTH_ACCOUNT_DISABLED',
  message: 'Account is disabled',
  messageKey: 'auth.account_disabled',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_REFRESH_TOKEN_INVALID: ExceptionDefinition = {
  code: 'AUTH_REFRESH_TOKEN_INVALID',
  message: 'Refresh token is invalid or expired',
  messageKey: 'auth.refresh_token_invalid',
  rpcStatus: status.UNAUTHENTICATED
}

export const AUTH_REFRESH_TOKEN_REPLAY_DETECTED: ExceptionDefinition = {
  code: 'AUTH_REFRESH_TOKEN_REPLAY_DETECTED',
  message: 'Refresh token replay detected',
  messageKey: 'auth.refresh_token_replay_detected',
  rpcStatus: status.PERMISSION_DENIED
}

export const AUTH_PERMISSION_UPSTREAM_UNAVAILABLE: ExceptionDefinition = {
  code: 'AUTH_PERMISSION_UPSTREAM_UNAVAILABLE',
  message: 'Permission upstream is unavailable for authorization checks',
  messageKey: 'auth.permission_upstream_unavailable',
  rpcStatus: status.UNAVAILABLE
}
