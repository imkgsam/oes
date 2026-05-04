"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCommonContractPath = resolveCommonContractPath;
exports.resolveCommonProtoPath = resolveCommonProtoPath;
const path_1 = require("path");
const commonPackageRoot = (0, path_1.dirname)((0, path_1.dirname)(require.resolve('@oes/common')));
/**
 * Resolve an absolute path under the shared contracts directory in @oes/common.
 */
function resolveCommonContractPath(...segments) {
    return (0, path_1.join)(commonPackageRoot, 'src', 'contracts', ...segments);
}
/**
 * Resolve an absolute proto file path under the shared contracts directory.
 */
function resolveCommonProtoPath(relativePath) {
    return resolveCommonContractPath(relativePath);
}
//# sourceMappingURL=contract-path.util.js.map