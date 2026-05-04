"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCheckAny = exports.PermissionCheckAll = exports.PermissionCheckType = exports.PERMISSION_CHECK_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSION_CHECK_KEY = 'permission_check';
var PermissionCheckType;
(function (PermissionCheckType) {
    PermissionCheckType["ALL"] = "ALL";
    PermissionCheckType["ANY"] = "ANY";
})(PermissionCheckType || (exports.PermissionCheckType = PermissionCheckType = {}));
const PermissionCheckAll = (permissions) => (0, common_1.SetMetadata)(exports.PERMISSION_CHECK_KEY, {
    type: PermissionCheckType.ALL,
    permissions
});
exports.PermissionCheckAll = PermissionCheckAll;
const PermissionCheckAny = (permissions) => (0, common_1.SetMetadata)(exports.PERMISSION_CHECK_KEY, {
    type: PermissionCheckType.ANY,
    permissions
});
exports.PermissionCheckAny = PermissionCheckAny;
//# sourceMappingURL=permission-check.decorator.js.map