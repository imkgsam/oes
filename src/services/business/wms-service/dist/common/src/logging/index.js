"use strict";
// File: src/common/src/logging/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLoggerAdapter = exports.GrpcAccessLogInterceptor = exports.REDACTED = exports.sanitizeLogMeta = exports.LOGGER_OPTIONS = exports.LoggingModule = exports.AppLogger = exports.PinoOtelLogger = exports.isLogMeta = exports.LogLevel = void 0;
// Interfaces and types
var oes_logger_interface_1 = require("./oes-logger.interface");
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return oes_logger_interface_1.LogLevel; } });
Object.defineProperty(exports, "isLogMeta", { enumerable: true, get: function () { return oes_logger_interface_1.isLogMeta; } });
// Core logger implementation
var pino_otel_logger_1 = require("./pino-otel.logger");
Object.defineProperty(exports, "PinoOtelLogger", { enumerable: true, get: function () { return pino_otel_logger_1.PinoOtelLogger; } });
// NestJS integration
var app_logger_service_1 = require("./app-logger.service");
Object.defineProperty(exports, "AppLogger", { enumerable: true, get: function () { return app_logger_service_1.AppLogger; } });
var logging_module_1 = require("./logging.module");
Object.defineProperty(exports, "LoggingModule", { enumerable: true, get: function () { return logging_module_1.LoggingModule; } });
var logging_constants_1 = require("./logging.constants");
Object.defineProperty(exports, "LOGGER_OPTIONS", { enumerable: true, get: function () { return logging_constants_1.LOGGER_OPTIONS; } });
var log_redaction_1 = require("./log-redaction");
Object.defineProperty(exports, "sanitizeLogMeta", { enumerable: true, get: function () { return log_redaction_1.sanitizeLogMeta; } });
Object.defineProperty(exports, "REDACTED", { enumerable: true, get: function () { return log_redaction_1.REDACTED; } });
var interceptors_1 = require("./interceptors");
Object.defineProperty(exports, "GrpcAccessLogInterceptor", { enumerable: true, get: function () { return interceptors_1.GrpcAccessLogInterceptor; } });
// Adapters for third-party SDK compatibility
var console_logger_adapter_1 = require("./console-logger.adapter");
Object.defineProperty(exports, "ConsoleLoggerAdapter", { enumerable: true, get: function () { return console_logger_adapter_1.ConsoleLoggerAdapter; } });
//# sourceMappingURL=index.js.map