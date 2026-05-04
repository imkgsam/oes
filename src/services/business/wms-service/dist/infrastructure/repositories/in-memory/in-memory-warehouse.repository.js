"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryWarehouseRepository = void 0;
const wms_assertions_1 = require("../../../application/support/wms-assertions");
/** InMemoryWarehouseRepository provides a deterministic topology repository for WMS L1 tests. */
class InMemoryWarehouseRepository {
    constructor(store) {
        this.store = store;
    }
    async findWarehouseById(tenantId, warehouseId) {
        const record = this.store.warehouses.get(warehouseId);
        return record?.tenantId === tenantId ? structuredClone(record) : null;
    }
    async searchWarehouses(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const keyword = (0, wms_assertions_1.normalizeOptionalString)(input.keyword)?.toLowerCase();
        const filtered = [...this.store.warehouses.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => {
            if (!keyword) {
                return true;
            }
            return (record.warehouseCode.toLowerCase().includes(keyword) ||
                record.warehouseName.toLowerCase().includes(keyword));
        })
            .sort((left, right) => left.warehouseCode.localeCompare(right.warehouseCode))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
    async findLocationById(tenantId, locationId) {
        const record = this.store.locations.get(locationId);
        return record && this.store.warehouses.get(record.warehouseId)?.tenantId === tenantId
            ? structuredClone(record)
            : null;
    }
    async searchLocations(input) {
        const { page, pageSize } = (0, wms_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.locations.values()]
            .filter((record) => this.store.warehouses.get(record.warehouseId)?.tenantId === input.tenantId)
            .filter((record) => !input.warehouseId || record.warehouseId === input.warehouseId)
            .filter((record) => !input.parentLocationId || (record.parentLocationId ?? null) === input.parentLocationId)
            .filter((record) => !input.locationType || record.locationType === input.locationType)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => input.supportsReceipt === undefined || record.supportsReceipt === input.supportsReceipt)
            .filter((record) => input.supportsStorage === undefined || record.supportsStorage === input.supportsStorage)
            .sort((left, right) => left.locationCode.localeCompare(right.locationCode))
            .map((record) => structuredClone(record));
        const { pageItems, total } = (0, wms_assertions_1.paginate)(filtered, page, pageSize);
        return { items: pageItems, total, page, pageSize };
    }
}
exports.InMemoryWarehouseRepository = InMemoryWarehouseRepository;
//# sourceMappingURL=in-memory-warehouse.repository.js.map