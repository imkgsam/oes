"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDACTED = void 0;
exports.sanitizeLogMeta = sanitizeLogMeta;
const REDACTED = '[REDACTED]';
exports.REDACTED = REDACTED;
const SECRET_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /cookie/i,
    /session/i,
    /api[-_]?key/i,
    /refresh[-_]?token/i,
    /access[-_]?token/i
];
const EMAIL_KEY_PATTERNS = [/email/i];
const PHONE_KEY_PATTERNS = [/phone/i, /mobile/i, /tel/i];
function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}
function shouldRedactKey(key) {
    return SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
}
function shouldMaskEmailKey(key) {
    return EMAIL_KEY_PATTERNS.some((pattern) => pattern.test(key));
}
function shouldMaskPhoneKey(key) {
    return PHONE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}
function maskEmail(value) {
    const atIndex = value.indexOf('@');
    if (atIndex <= 1) {
        return REDACTED;
    }
    return `${value.slice(0, 1)}***${value.slice(atIndex)}`;
}
function maskPhone(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 7) {
        return REDACTED;
    }
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}
function sanitizeValue(key, value) {
    if (shouldRedactKey(key)) {
        return REDACTED;
    }
    if (typeof value === 'string') {
        if (shouldMaskEmailKey(key)) {
            return maskEmail(value);
        }
        if (shouldMaskPhoneKey(key)) {
            return maskPhone(value);
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(key, item));
    }
    if (isPlainObject(value)) {
        return sanitizeObject(value);
    }
    return value;
}
function sanitizeObject(value) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(key, item)]));
}
function sanitizeLogMeta(meta) {
    if (!meta) {
        return {};
    }
    return sanitizeObject(meta);
}
//# sourceMappingURL=log-redaction.js.map