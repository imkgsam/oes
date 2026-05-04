"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceId = getTraceId;
exports.getSpanId = getSpanId;
const api_1 = require("@opentelemetry/api");
function getTraceId() {
    return api_1.trace.getActiveSpan()?.spanContext().traceId ?? 'unknown';
}
function getSpanId() {
    return api_1.trace.getActiveSpan()?.spanContext().spanId ?? 'unknown';
}
//# sourceMappingURL=trace-context.js.map