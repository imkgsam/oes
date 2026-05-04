"use strict";
// File: src/common/src/logging/logging.module.ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_logger_service_1 = require("./app-logger.service");
const logging_constants_1 = require("./logging.constants");
const interceptors_1 = require("./interceptors");
let LoggingModule = LoggingModule_1 = class LoggingModule {
    /**
     * Configure the logging module with custom options.
     *
     * @param options - Logger configuration options
     * @returns Dynamic module with configured AppLogger
     */
    static forRoot(options) {
        return {
            module: LoggingModule_1,
            providers: [
                {
                    provide: logging_constants_1.LOGGER_OPTIONS,
                    useValue: options
                },
                app_logger_service_1.AppLogger,
                interceptors_1.GrpcAccessLogInterceptor,
                {
                    provide: core_1.APP_INTERCEPTOR,
                    useExisting: interceptors_1.GrpcAccessLogInterceptor
                }
            ],
            exports: [app_logger_service_1.AppLogger, interceptors_1.GrpcAccessLogInterceptor]
        };
    }
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = LoggingModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            app_logger_service_1.AppLogger,
            interceptors_1.GrpcAccessLogInterceptor,
            {
                provide: core_1.APP_INTERCEPTOR,
                useExisting: interceptors_1.GrpcAccessLogInterceptor
            }
        ],
        exports: [app_logger_service_1.AppLogger, interceptors_1.GrpcAccessLogInterceptor]
    })
], LoggingModule);
//# sourceMappingURL=logging.module.js.map