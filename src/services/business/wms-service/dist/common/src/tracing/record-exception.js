"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordExceptionToActiveSpan = recordExceptionToActiveSpan;
const api_1 = require("@opentelemetry/api");
function recordExceptionToActiveSpan(exception) {
    const activeSpan = api_1.trace.getActiveSpan();
    if (!activeSpan)
        return;
    if (exception instanceof Error) {
        activeSpan.recordException(exception);
    }
    else if (typeof exception === 'string') {
        activeSpan.recordException(new Error(exception));
    }
    else {
        activeSpan.recordException(new Error(JSON.stringify(exception)));
    }
    activeSpan.setStatus({ code: api_1.SpanStatusCode.ERROR });
}
//# sourceMappingURL=record-exception.js.map