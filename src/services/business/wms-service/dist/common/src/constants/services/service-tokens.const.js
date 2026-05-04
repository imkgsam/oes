"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMAIN_PORT = exports.PARTY_PORT = exports.IDENTITY_ACCOUNT_PORT = exports.IDENTITY_USER_PORT = exports.AUTH_LOGIN_PORT = exports.PERMISSION_CHECK_PORT = exports.PERMISSION_MANAGEMENT_PORT = exports.RESOURCE_SERVICE = exports.PARTY_SERVICE = exports.AUTH_SERVICE = exports.PERMISSION_SERVICE = exports.IDENTITY_SERVICE = exports.API_GATEWAY = void 0;
// ── Service identifiers ──
exports.API_GATEWAY = Symbol('api-gateway');
exports.IDENTITY_SERVICE = Symbol('identity-service');
exports.PERMISSION_SERVICE = Symbol('permission-service');
exports.AUTH_SERVICE = Symbol('auth-service');
exports.PARTY_SERVICE = Symbol('party-service');
exports.RESOURCE_SERVICE = Symbol('resource-service');
// ── Port injection tokens (used by api-gateway adapters) ──
exports.PERMISSION_MANAGEMENT_PORT = Symbol('PERMISSION_MANAGEMENT_PORT');
exports.PERMISSION_CHECK_PORT = Symbol('PERMISSION_CHECK_PORT');
exports.AUTH_LOGIN_PORT = Symbol('AUTH_LOGIN_PORT');
exports.IDENTITY_USER_PORT = Symbol('IDENTITY_USER_PORT');
exports.IDENTITY_ACCOUNT_PORT = Symbol('IDENTITY_ACCOUNT_PORT');
exports.PARTY_PORT = Symbol('PARTY_PORT');
exports.DOMAIN_PORT = Symbol('DOMAIN_PORT');
//# sourceMappingURL=service-tokens.const.js.map