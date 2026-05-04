"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const require_authenticated_operator_decorator_1 = require("./require-authenticated-operator.decorator");
const RequirePermission = (permission) => (0, common_1.applyDecorators)((0, require_authenticated_operator_decorator_1.RequireAuthenticatedOperator)(), (0, common_1.SetMetadata)(constants_1.REQUIRE_PERMISSION_METADATA_KEY, permission));
exports.RequirePermission = RequirePermission;
//# sourceMappingURL=require-permission.decorator.js.map