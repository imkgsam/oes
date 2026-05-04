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
exports.tokenConfig = exports.authKeyConfig = void 0;
var authKey_config_1 = require("./configs/authKey.config");
Object.defineProperty(exports, "authKeyConfig", { enumerable: true, get: function () { return authKey_config_1.default; } });
var token_config_1 = require("./configs/token.config");
Object.defineProperty(exports, "tokenConfig", { enumerable: true, get: function () { return token_config_1.default; } });
__exportStar(require("./configs/authKey.config"), exports);
__exportStar(require("./configs/token.config"), exports);
__exportStar(require("./decorators/is-public.decorator"), exports);
__exportStar(require("./guards/gateway-jwt-auth.guard"), exports);
__exportStar(require("./jwt/jwt.module"), exports);
__exportStar(require("./jwt/jwt.service"), exports);
__exportStar(require("./jwt/jwtOptions.factory"), exports);
__exportStar(require("./jwt/token.type"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map