"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCheckCapability = void 0;
const capability_interface_1 = require("../../core/interfaces/capability.interface");
exports.PermissionCheckCapability = {
    checkPermission: {
        description: 'Pure RBAC permission check',
        transport: [capability_interface_1.Transport.GRPC]
    },
    // OUTDATED: compatibility capability for the historical context RPC; do not use for new resource authorization integrations.
    checkPermissionWithContext: {
        description: 'OUTDATED compatibility RPC for historical RBAC + ABAC evaluation context checks',
        transport: [capability_interface_1.Transport.GRPC]
    }
};
//# sourceMappingURL=capabilities.js.map