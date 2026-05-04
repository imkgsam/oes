"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicInterface = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const PublicInterface = () => (0, common_1.SetMetadata)(constants_1.PUBLIC_INTERFACE_METADATA_KEY, true);
exports.PublicInterface = PublicInterface;
//# sourceMappingURL=public-interface.decorator.js.map