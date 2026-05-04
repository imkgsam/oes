"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectGrpcTraceContext = injectGrpcTraceContext;
exports.extractGrpcTraceContext = extractGrpcTraceContext;
exports.parseGrpcTraceContext = parseGrpcTraceContext;
const api_1 = require("@opentelemetry/api");
const constants_1 = require("../authorization/constants");
const utils_1 = require("../authorization/utils");
/** This helper writes the active OTel span context into gRPC metadata using W3C trace headers. */
function injectGrpcTraceContext(metadata, sourceContext = api_1.context.active()) {
    const spanContext = api_1.trace.getSpan(sourceContext)?.spanContext();
    if (!spanContext || !(0, api_1.isSpanContextValid)(spanContext)) {
        return;
    }
    metadata.set(constants_1.TRACEPARENT_METADATA_KEY, formatTraceparent(spanContext));
    const traceState = spanContext.traceState?.serialize();
    if (traceState) {
        metadata.set(constants_1.TRACESTATE_METADATA_KEY, traceState);
    }
}
/** This helper rebuilds an OTel context from gRPC metadata so tests and future interceptors can restore distributed tracing. */
function extractGrpcTraceContext(metadata, baseContext = api_1.context.active()) {
    const spanContext = parseGrpcTraceContext(metadata);
    if (!spanContext) {
        return baseContext;
    }
    return api_1.trace.setSpan(baseContext, api_1.trace.wrapSpanContext(spanContext));
}
/** This helper parses W3C trace headers from gRPC metadata into an OTel span context. */
function parseGrpcTraceContext(metadata) {
    const traceparent = (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.TRACEPARENT_METADATA_KEY);
    if (!traceparent) {
        return undefined;
    }
    const match = TRACEPARENT_PATTERN.exec(traceparent.trim());
    if (!match) {
        return undefined;
    }
    const [, , traceId, spanId, traceFlagsHex] = match;
    const traceStateHeader = (0, utils_1.getGrpcMetadataValue)(metadata, constants_1.TRACESTATE_METADATA_KEY);
    const spanContext = {
        traceId,
        spanId,
        traceFlags: parseInt(traceFlagsHex, 16),
        isRemote: true,
        traceState: traceStateHeader ? (0, api_1.createTraceState)(traceStateHeader) : undefined
    };
    return (0, api_1.isSpanContextValid)(spanContext) ? spanContext : undefined;
}
/** This helper serializes an OTel span context into the canonical W3C traceparent header format. */
function formatTraceparent(spanContext) {
    return `00-${spanContext.traceId}-${spanContext.spanId}-${spanContext.traceFlags.toString(16).padStart(2, '0')}`;
}
const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
//# sourceMappingURL=grpc-trace-context.js.map