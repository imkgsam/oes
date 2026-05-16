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

export const AUTH_MFA_LOGIN_METHOD_UNAVAILABLE: ExceptionDefinition = {
  code: 'AUTH_MFA_LOGIN_METHOD_UNAVAILABLE',
  message: 'Required login method is unavailable for MFA binding',
  messageKey: 'auth.mfa_login_method_unavailable',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_MFA_FACTOR_UNAVAILABLE: ExceptionDefinition = {
  code: 'AUTH_MFA_FACTOR_UNAVAILABLE',
  message: 'No available MFA factor can satisfy the current login challenge',
  messageKey: 'auth.mfa_factor_unavailable',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_MFA_INVALID_CODE: ExceptionDefinition = {
  code: 'AUTH_MFA_INVALID_CODE',
  message: 'MFA code is invalid',
  messageKey: 'auth.mfa_invalid_code',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_MFA_STEP_UP_REQUIRED: ExceptionDefinition = {
  code: 'AUTH_MFA_STEP_UP_REQUIRED',
  message: 'Step-up MFA is required',
  messageKey: 'auth.mfa_step_up_required',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_MFA_RECOVERY_CODES_REQUIRE_TOTP: ExceptionDefinition = {
  code: 'AUTH_MFA_RECOVERY_CODES_REQUIRE_TOTP',
  message: 'Recovery codes require an active TOTP binding',
  messageKey: 'auth.mfa_recovery_codes_require_totp',
  rpcStatus: status.FAILED_PRECONDITION
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

export const AUTH_TENANT_NOT_ACTIVE: ExceptionDefinition = {
  code: 'AUTH_TENANT_NOT_ACTIVE',
  message: 'Tenant is not active for authentication',
  messageKey: 'auth.tenant_not_active',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_SESSION_NOT_FOUND: ExceptionDefinition = {
  code: 'AUTH_SESSION_NOT_FOUND',
  message: 'Session was not found',
  messageKey: 'auth.session_not_found',
  rpcStatus: status.NOT_FOUND
}

export const AUTH_SESSION_OWNER_MISMATCH: ExceptionDefinition = {
  code: 'AUTH_SESSION_OWNER_MISMATCH',
  message: 'Session does not belong to the current user',
  messageKey: 'auth.session_owner_mismatch',
  rpcStatus: status.PERMISSION_DENIED
}

export const AUTH_REFRESH_TOKEN_INVALID: ExceptionDefinition = {
  code: 'AUTH_REFRESH_TOKEN_INVALID',
  message: 'Refresh token is invalid or expired',
  messageKey: 'auth.refresh_token_invalid',
  rpcStatus: status.UNAUTHENTICATED
}

export const AUTH_ACCESS_TOKEN_INVALID: ExceptionDefinition = {
  code: 'AUTH_ACCESS_TOKEN_INVALID',
  message: 'Access token is invalid or expired',
  messageKey: 'auth.access_token_invalid',
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

export const AUTH_TERMINAL_ACCESS_DENIED: ExceptionDefinition = {
  code: 'AUTH_TERMINAL_ACCESS_DENIED',
  message: 'Terminal access denied',
  messageKey: 'auth.terminal_access_denied',
  rpcStatus: status.PERMISSION_DENIED
}

export const AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE: ExceptionDefinition = {
  code: 'AUTH_NOTIFICATION_UPSTREAM_UNAVAILABLE',
  message: 'Notification upstream is unavailable for OTP delivery',
  messageKey: 'auth.notification_upstream_unavailable',
  rpcStatus: status.UNAVAILABLE
}

export const AUTH_OTP_DELIVERY_REJECTED: ExceptionDefinition = {
  code: 'AUTH_OTP_DELIVERY_REJECTED',
  message: 'OTP delivery request was rejected',
  messageKey: 'auth.otp_delivery_rejected',
  rpcStatus: status.FAILED_PRECONDITION
}

export const AUTH_PASSWORD_RECOVERY_GRANT_INVALID: ExceptionDefinition = {
  code: 'AUTH_PASSWORD_RECOVERY_GRANT_INVALID',
  message: 'Password recovery grant is invalid',
  messageKey: 'auth.password_recovery_grant_invalid',
  rpcStatus: status.INVALID_ARGUMENT
}

export const AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED: ExceptionDefinition = {
  code: 'AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED',
  message: 'Password recovery grant has expired',
  messageKey: 'auth.password_recovery_grant_expired',
  rpcStatus: status.FAILED_PRECONDITION
}
