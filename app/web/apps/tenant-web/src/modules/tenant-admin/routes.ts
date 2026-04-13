import type { RouteRecordRaw } from 'vue-router';

// Tenant administration is reserved as a first-class tenant-web module.
// Concrete pages will be introduced once tenant governance flows are ready.
const tenantAdminRoutes: RouteRecordRaw[] = [];

export { tenantAdminRoutes };
export default tenantAdminRoutes;
