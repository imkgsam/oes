"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthKeyConfigName = void 0;
const config_1 = require("@nestjs/config");
exports.AuthKeyConfigName = 'authkey';
exports.default = (0, config_1.registerAs)(exports.AuthKeyConfigName, () => ({
    publicKeyPath: process.env.AUTH_PUBLIC_KEY_PATH || 'src/auth/keys/public.key',
    privateKeyPath: process.env.AUTH_PRIVATE_KEY_PATH || 'src/auth/keys/private.key'
}));
//# sourceMappingURL=authKey.config.js.map