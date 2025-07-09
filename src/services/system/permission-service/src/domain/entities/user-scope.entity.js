"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserScope = void 0;
class UserScope {
    id;
    userId;
    permissionCode;
    resourceType;
    resourceId;
    constructor(id, userId, permissionCode, resourceType, resourceId) {
        this.id = id;
        this.userId = userId;
        this.permissionCode = permissionCode;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
    matches(resourceType, resourceId) {
        return this.resourceType === resourceType && this.resourceId === resourceId;
    }
}
exports.UserScope = UserScope;
//# sourceMappingURL=user-scope.entity.js.map