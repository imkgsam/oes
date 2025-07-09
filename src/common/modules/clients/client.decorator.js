"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectServiceClient = InjectServiceClient;
const common_1 = require("@nestjs/common");
const service_map_1 = require("./service-map");
function InjectServiceClient(serviceKey) {
    return (0, common_1.Inject)(service_map_1.SERVICE_CLIENT_TOKENS[serviceKey]);
}
//# sourceMappingURL=client.decorator.js.map