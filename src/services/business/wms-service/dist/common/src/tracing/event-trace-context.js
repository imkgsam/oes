"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureEventTraceContext = captureEventTraceContext;
const trace_context_1 = require("./trace-context");
/**
 * captureEventTraceContext snapshots the current active span so emitted events keep correlation identifiers.
 */
function captureEventTraceContext() {
    const traceId = (0, trace_context_1.getTraceId)();
    const spanId = (0, trace_context_1.getSpanId)();
    return {
        traceId: traceId === 'unknown' ? null : traceId,
        spanId: spanId === 'unknown' ? null : spanId
    };
}
//# sourceMappingURL=event-trace-context.js.map