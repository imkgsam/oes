"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCommandHandlers = void 0;
const send_email_handler_1 = require("./send-email.handler");
const send_sms_handler_1 = require("./send-sms.handler");
__exportStar(require("./send-email.command"), exports);
__exportStar(require("./send-sms.command"), exports);
exports.NotificationCommandHandlers = [send_email_handler_1.SendEmailHandler, send_sms_handler_1.SendSmsHandler];
//# sourceMappingURL=index.js.map