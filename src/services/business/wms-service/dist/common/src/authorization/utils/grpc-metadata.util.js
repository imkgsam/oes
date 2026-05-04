"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrpcMetadataValue = getGrpcMetadataValue;
exports.attachOperatorContext = attachOperatorContext;
exports.attachInternalService = attachInternalService;
exports.getAuthenticatedGrpcRequestContext = getAuthenticatedGrpcRequestContext;
const constants_1 = require("../constants");
function getGrpcMetadataValue(metadata, key) {
    if (!metadata) {
        return undefined;
    }
    const values = metadata.get(key);
    const firstValue = values[0];
    if (typeof firstValue === 'string') {
        return firstValue;
    }
    if (Buffer.isBuffer(firstValue)) {
        return firstValue.toString('utf8');
    }
    return undefined;
}
function attachOperatorContext(rpcData, payload) {
    if (!rpcData || typeof rpcData !== 'object') {
        return undefined;
    }
    const target = rpcData;
    const existing = target[constants_1.RPC_OPERATOR_CONTEXT_KEY] ?? {};
    const next = {
        ...existing,
        operatorContext: payload
    };
    target[constants_1.RPC_OPERATOR_CONTEXT_KEY] = next;
    return next;
}
function attachInternalService(rpcData, serviceName) {
    if (!rpcData || typeof rpcData !== 'object') {
        return undefined;
    }
    const target = rpcData;
    const existing = target[constants_1.RPC_OPERATOR_CONTEXT_KEY] ?? {};
    const next = {
        ...existing,
        internalService: {
            serviceName
        }
    };
    target[constants_1.RPC_OPERATOR_CONTEXT_KEY] = next;
    return next;
}
function getAuthenticatedGrpcRequestContext(rpcData) {
    if (!rpcData || typeof rpcData !== 'object') {
        return undefined;
    }
    return rpcData[constants_1.RPC_OPERATOR_CONTEXT_KEY];
}
//# sourceMappingURL=grpc-metadata.util.js.map