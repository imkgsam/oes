"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_NOT_FOUND = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
exports.USER_NOT_FOUND = {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    rpcStatus: grpc_js_1.status.NOT_FOUND,
    messageKey: 'user.not.found'
};
//# sourceMappingURL=domain-exception.enum.js.map