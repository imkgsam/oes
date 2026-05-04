"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLocationQuery = void 0;
/** GetLocationQuery captures one tenant-scoped location lookup by location_id. */
class GetLocationQuery {
    tenantId;
    locationId;
    constructor(tenantId, locationId) {
        this.tenantId = tenantId;
        this.locationId = locationId;
    }
}
exports.GetLocationQuery = GetLocationQuery;
//# sourceMappingURL=get-location.query.js.map