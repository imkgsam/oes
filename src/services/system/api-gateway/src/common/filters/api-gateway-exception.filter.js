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
var ApiGatewayExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGatewayExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const exception_helper_1 = require("@oes/common/helpers/exception.helper");
const module_codes_1 = require("@oes/common/constants/res-codes/module.codes");
const trace_context_1 = require("@oes/common/modules/trace/trace-context");
const runtime_errors_1 = require("@oes/common/constants/res-codes/runtime.errors");
let ApiGatewayExceptionsFilter = ApiGatewayExceptionsFilter_1 = class ApiGatewayExceptionsFilter {
    constructor(moduleName = process.env.MODULE_NAME || 'UNKNOWN') {
        this.moduleName = moduleName;
        this.logger = new common_1.Logger(ApiGatewayExceptionsFilter_1.name);
    }
    catch(exception, host) {
        this.logger.error('in ApiGatewayExceptionsFilter catch: ', exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let responseBody = this.buildDefaultResponse(request.url);
        if (exception instanceof common_1.HttpException) {
            this.logger.error('Caught HttpException:');
            const { statusCode, body } = this.handleHttpException(exception, request.url);
            status = statusCode;
            responseBody = body;
        }
        else if (exception instanceof microservices_1.RpcException) {
            this.logger.error('Caught RpcException:');
            const { statusCode, body } = this.handleRpcException(exception, request.url);
            status = statusCode;
            responseBody = body;
        }
        else {
            this.logger.error('Caught unknown Exception:');
            const { statusCode, body } = this.handleGenericError(exception, request.url);
            status = statusCode;
            responseBody = body;
        }
        response.status(status).json(responseBody);
    }
    buildDefaultResponse(path) {
        console.log('in buildDefaultResponse', path);
        return {
            code: (0, exception_helper_1.buildGlobalErrorCode)(module_codes_1.EXCEPTION_TYPE_PREFIX.RUNTIME, this.moduleName, runtime_errors_1.GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.subCode),
            traceId: (0, trace_context_1.getTraceId)(),
            message: runtime_errors_1.GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message,
            messageKey: runtime_errors_1.GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.messageKey,
            details: null,
            timestamp: new Date().toISOString(),
            path
        };
    }
    handleHttpException(exception, path) {
        const statusCode = exception.getStatus();
        const res = exception.getResponse();
        let defualtRes = this.buildDefaultResponse(path);
        if (typeof res === 'string') {
            defualtRes.message = res;
        }
        else if (typeof res === 'object' && res !== null) {
            defualtRes = {
                ...defualtRes,
                ...res,
                timestamp: new Date().toISOString(),
                path
            };
        }
        return { statusCode, body: defualtRes };
    }
    handleRpcException(exception, path) {
        const exceptionError = exception.getError?.();
        const defualtRes = this.buildDefaultResponse(path);
        let statusCode = common_1.HttpStatus.BAD_GATEWAY;
        if ((0, exception_helper_1.isRpcError)(exceptionError)) {
            const { error, context } = exceptionError;
            statusCode = error.httpStatus || common_1.HttpStatus.BAD_REQUEST;
            defualtRes.code = error.code || defualtRes.code;
            defualtRes.message = error.message || defualtRes.message;
            defualtRes.messageKey = error.messageKey || defualtRes.messageKey;
            defualtRes.details = error.details || undefined;
            defualtRes.traceId = context.traceId || defualtRes.traceId;
            defualtRes.timestamp = context.timestamp || new Date().toISOString();
            defualtRes.debugContext = {
                callStack: context.callStack || [context.module],
                isPropagated: context.isPropagated ?? true,
                timestamp: context.timestamp || new Date().toISOString(),
                module: context.module,
                spanId: context.spanId
            };
        }
        else {
            if (typeof exceptionError === 'string')
                defualtRes.message = exceptionError;
            if (typeof exceptionError === 'object')
                defualtRes.details = exceptionError;
        }
        return { statusCode, body: defualtRes };
    }
    handleGenericError(exception, path) {
        const statusCode = runtime_errors_1.GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.httpStatus;
        const defaultRes = this.buildDefaultResponse(path);
        if (exception instanceof Error) {
            defaultRes.message = exception.message || runtime_errors_1.GLOBAL_RUNTIME_ERRORS.UNKNOWN_ERROR.message;
            defaultRes.details = {
                name: exception.name,
                stack: exception.stack
            };
        }
        if (typeof exception === 'string' || typeof exception === 'number') {
            defaultRes.message = String(exception);
            defaultRes.details = { value: exception };
        }
        else if (typeof exception === 'object' && exception !== null) {
            defaultRes.details = exception;
        }
        return { statusCode, body: defaultRes };
    }
};
exports.ApiGatewayExceptionsFilter = ApiGatewayExceptionsFilter;
exports.ApiGatewayExceptionsFilter = ApiGatewayExceptionsFilter = ApiGatewayExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [String])
], ApiGatewayExceptionsFilter);
//# sourceMappingURL=api-gateway-exception.filter.js.map