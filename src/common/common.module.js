"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const permission_controll_guard_1 = require("./guards/permission-controll.guard");
const client_module_1 = require("./modules/clients/client.module");
const scope_controll_guard_1 = require("./guards/scope-controll.guard");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [client_module_1.ClientModule],
        providers: [permission_controll_guard_1.PermissionControllGuard, scope_controll_guard_1.ScopeControllGuard],
        exports: [permission_controll_guard_1.PermissionControllGuard, scope_controll_guard_1.ScopeControllGuard, client_module_1.ClientModule]
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map