"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectServiceClient = void 0;
const common_1 = require("@nestjs/common");
const InjectServiceClient = (serviceKey) => (0, common_1.Inject)(serviceKey);
exports.InjectServiceClient = InjectServiceClient;
//# sourceMappingURL=client.decorator.js.map