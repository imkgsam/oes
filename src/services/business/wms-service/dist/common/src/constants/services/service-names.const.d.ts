export declare const SERVICE_NAMES: {
    readonly API_GATEWAY: "api-gateway";
    readonly ASSET: "asset-service";
    readonly AUTH: "auth-service";
    readonly CRM: "crm-service";
    readonly FINANCE: "finance-service";
    readonly HR: "hr-service";
    readonly IDENTITY: "identity-service";
    readonly ITEM_MASTER: "item-master-service";
    readonly PERMISSION: "permission-service";
    readonly NOTIFICATION: "notification-service";
    readonly PARTY: "party-service";
    readonly PROCUREMENT: "procurement-service";
    readonly SRM: "srm-service";
    readonly TENANT_ORG: "tenant-org-service";
    readonly RESOURCE: "resource-service";
    readonly WMS: "wms-service";
};
export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];
