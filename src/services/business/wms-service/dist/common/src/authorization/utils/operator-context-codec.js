"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeOperatorContext = encodeOperatorContext;
exports.decodeOperatorContext = decodeOperatorContext;
exports.getUnsignedOperatorContextPayload = getUnsignedOperatorContextPayload;
exports.canonicalizeOperatorContextForSigning = canonicalizeOperatorContextForSigning;
exports.validateOperatorContextPayload = validateOperatorContextPayload;
const SIGNATURE_FIELD = 'signature';
function stableSortObject(value) {
    if (Array.isArray(value)) {
        return value.map((item) => stableSortObject(item));
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
        const nestedValue = value[key];
        if (nestedValue !== undefined) {
            acc[key] = stableSortObject(nestedValue);
        }
        return acc;
    }, {});
}
function encodeOperatorContext(payload) {
    return JSON.stringify(payload);
}
function decodeOperatorContext(rawPayload) {
    const parsed = JSON.parse(rawPayload);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('operator context must be a JSON object');
    }
    return parsed;
}
function getUnsignedOperatorContextPayload(payload) {
    const { signature, ...unsignedPayload } = payload;
    return unsignedPayload;
}
function canonicalizeOperatorContextForSigning(payload) {
    const unsignedPayload = getUnsignedOperatorContextPayload(payload);
    return JSON.stringify(stableSortObject(unsignedPayload));
}
function validateOperatorContextPayload(payload) {
    const requiredFields = [
        'operator_id',
        'operator_type',
        'issued_at',
        'expires_at',
        'issuer',
        'signature'
    ];
    for (const field of requiredFields) {
        const value = payload[field];
        if (typeof value !== 'string' || value.trim().length === 0) {
            return `missing required field: ${field}`;
        }
    }
    if (payload.operator_roles && !Array.isArray(payload.operator_roles)) {
        return 'operator_roles must be an array';
    }
    const issuedAt = Date.parse(payload.issued_at);
    const expiresAt = Date.parse(payload.expires_at);
    if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) {
        return 'issued_at or expires_at is invalid';
    }
    if (expiresAt <= issuedAt) {
        return 'expires_at must be later than issued_at';
    }
    if (Date.now() >= expiresAt) {
        return 'operator context has expired';
    }
    return undefined;
}
//# sourceMappingURL=operator-context-codec.js.map