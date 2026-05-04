"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionFactory = void 0;
const oes_exception_1 = require("./oes.exception");
class ExceptionFactory {
    // 创建领域异常
    static domain(definition, internalDetails) {
        return new oes_exception_1.DomainException(definition, internalDetails);
    }
    // 创建应用异常
    static application(definition, internalDetails) {
        return new oes_exception_1.ApplicationException(definition, internalDetails);
    }
    // 创建基础设施异常
    static infrastructure(definition, internalDetails) {
        return new oes_exception_1.InfrastructureException(definition, internalDetails);
    }
}
exports.ExceptionFactory = ExceptionFactory;
//# sourceMappingURL=exception.factory.js.map