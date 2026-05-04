"use strict";
// File: src/common/src/logging/oes-logger.interface.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.isLogMeta = isLogMeta;
/**
 * Log level enumeration for programmatic level control.
 * Follows standard severity ordering: debug < info < warn < error
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Type guard to check if an object conforms to LogMeta interface.
 * Used internally to distinguish between structured and variadic calls.
 *
 * @param value - Value to check
 * @returns True if value is a valid LogMeta object
 */
function isLogMeta(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    // LogMeta is a plain object with optional known keys
    // Exclude arrays, Errors, and other special objects
    if (Array.isArray(value) || value instanceof Error || value instanceof Date) {
        return false;
    }
    const obj = value;
    const knownKeys = [
        'module',
        'operation',
        'requestId',
        'traceId',
        'spanId',
        'tenantId',
        'orgId',
        'operatorId',
        'resourceType',
        'resourceId',
        'errorCode',
        'details'
    ];
    // Check if object has at least one known LogMeta key
    // or is an empty object (valid as empty metadata)
    const hasKnownKey = knownKeys.some((key) => key in obj);
    const isEmpty = Object.keys(obj).length === 0;
    return hasKnownKey || isEmpty;
}
//# sourceMappingURL=oes-logger.interface.js.map