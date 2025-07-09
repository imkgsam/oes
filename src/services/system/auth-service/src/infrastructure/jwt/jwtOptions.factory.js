"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsFactory = void 0;
const config_1 = require("@nestjs/config");
const authKey_config_1 = require("../config/authKey.config");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
let OptionsFactory = class OptionsFactory {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async createJwtOptions() {
        const keys = this.configService.getOrThrow(authKey_config_1.AuthKeyConfigName);
        const publicKey = await (0, promises_1.readFile)((0, path_1.join)(__dirname, '../../..', keys.publicKeyPath), 'utf8');
        const privateKey = await (0, promises_1.readFile)((0, path_1.join)(__dirname, '../../..', keys.privateKeyPath), 'utf8');
        return {
            publicKey,
            privateKey,
            signOptions: {
                algorithm: 'RS256',
            },
        };
    }
};
exports.OptionsFactory = OptionsFactory;
exports.OptionsFactory = OptionsFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OptionsFactory);
//# sourceMappingURL=jwtOptions.factory.js.map