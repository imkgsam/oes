"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostReceiptCommand = void 0;
/** PostReceiptCommand captures one request to convert a draft receipt into immutable inventory truth. */
class PostReceiptCommand {
    payload;
    constructor(payload) {
        this.payload = payload;
    }
}
exports.PostReceiptCommand = PostReceiptCommand;
//# sourceMappingURL=post-receipt.command.js.map