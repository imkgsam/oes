"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAuthenticatedOperator = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const RequireAuthenticatedOperator = () => (0, common_1.applyDecorators)((0, common_1.SetMetadata)(constants_1.MANAGEMENT_INTERFACE_METADATA_KEY, true), (0, common_1.SetMetadata)(constants_1.REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY, true));
exports.RequireAuthenticatedOperator = RequireAuthenticatedOperator;
//# sourceMappingURL=require-authenticated-operator.decorator.js.map