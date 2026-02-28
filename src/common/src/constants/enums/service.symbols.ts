// ── Service identifiers ──
export const API_GATEWAY = Symbol('api-gateway')
export const IDENTITY_SERVICE = Symbol('identity-service')
export const PERMISSION_SERVICE = Symbol('permission-service')
export const AUTH_SERVICE = Symbol('auth-service')
export const ENTITY_SERVICE = Symbol('entity-service')
export const RESOURCE_SERVICE = Symbol('resource-service')

// ── Port injection tokens (used by api-gateway adapters) ──
export const PERMISSION_MANAGEMENT_PORT = Symbol('PERMISSION_MANAGEMENT_PORT')
export const PERMISSION_CHECK_PORT = Symbol('PERMISSION_CHECK_PORT')
export const AUTH_LOGIN_PORT = Symbol('AUTH_LOGIN_PORT')
export const IDENTITY_USER_PORT = Symbol('IDENTITY_USER_PORT')
export const IDENTITY_ACCOUNT_PORT = Symbol('IDENTITY_ACCOUNT_PORT')
export const ENTITY_PORT = Symbol('ENTITY_PORT')
export const DOMAIN_PORT = Symbol('DOMAIN_PORT')
