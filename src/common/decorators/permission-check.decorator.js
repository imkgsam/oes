"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCheck = exports.PERMISSION_CHECK_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSION_CHECK_KEY = 'permission_check';
const PermissionCheck = (permission) => (0, common_1.SetMetadata)(exports.PERMISSION_CHECK_KEY, { Permissions });
exports.PermissionCheck = PermissionCheck;
//# sourceMappingURL=permission-check.decorator.js.map