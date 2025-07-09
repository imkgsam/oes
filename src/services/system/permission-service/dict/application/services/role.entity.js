"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
class Role {
    id;
    name;
    module;
    description;
    permissions;
    constructor(id, name, module, description = null) {
        this.id = id;
        this.name = name;
        this.module = module;
        this.description = description;
    }
}
exports.Role = Role;
//# sourceMappingURL=role.entity.js.map