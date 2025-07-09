"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenConfigName = void 0;
const config_1 = require("@nestjs/config");
exports.TokenConfigName = 'token';
exports.default = (0, config_1.registerAs)(exports.TokenConfigName, () => ({
    accessTokenValidity: parseInt(process.env.ACCESS_TOKEN_VALIDITY_SEC || '0'),
    refreshTokenValidity: parseInt(process.env.REFRESH_TOKEN_VALIDITY_SEC || '0'),
    issuer: process.env.TOKEN_ISSUER || '',
    audience: process.env.TOKEN_AUDIENCE || '',
}));
//# sourceMappingURL=token.config.js.map