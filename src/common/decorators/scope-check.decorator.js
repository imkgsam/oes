"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopeCheck = exports.SCOPE_CHECK_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.SCOPE_CHECK_KEY = 'scope_check';
const ScopeCheck = (permission, resourceParam) => (0, common_1.SetMetadata)(exports.SCOPE_CHECK_KEY, { permission, resourceParam: resourceParam });
exports.ScopeCheck = ScopeCheck;
//# sourceMappingURL=scope-check.decorator.js.map