"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
class Role {
    id;
    name;
    module;
    description;
    permissions;
    users;
    constructor(id, name, module, description = null, permissions = [], users = []) {
        this.id = id;
        this.name = name;
        this.module = module;
        this.description = description;
        this.permissions = permissions;
        this.users = users;
    }
    assignPermission(permission) {
        this.permissions.push(permission);
    }
    assignUser(user) {
        this.users.push(user);
    }
}
exports.Role = Role;
//# sourceMappingURL=role.entity.js.map