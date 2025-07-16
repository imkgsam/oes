"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceStorage = void 0;
exports.setTraceId = setTraceId;
exports.getTraceId = getTraceId;
const async_hooks_1 = require("async_hooks");
exports.traceStorage = new async_hooks_1.AsyncLocalStorage();
function setTraceId(traceId) {
    exports.traceStorage.enterWith({ traceId });
}
function getTraceId() {
    return exports.traceStorage.getStore()?.traceId;
}
//# sourceMappingURL=trace-context.js.map