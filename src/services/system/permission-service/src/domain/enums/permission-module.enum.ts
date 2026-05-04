// File: src/services/system/permission-service/src/domain/enums/permission-module.enum.ts
export enum PermissionModule {
  PERMISSION_SERVICE = 'PERMISSION_SERVICE',
  AUTH_SERVICE = 'AUTH_SERVICE',
  IDENTITY_SERVICE = 'IDENTITY_SERVICE',
  TENANT_ORG_SERVICE = 'TENANT_ORG_SERVICE',
  HR_SERVICE = 'HR_SERVICE',
  ITEM_MASTER_SERVICE = 'ITEM_MASTER_SERVICE',
  CRM_SERVICE = 'CRM_SERVICE',
  SRM_SERVICE = 'SRM_SERVICE',
  SALES_SERVICE = 'SALES_SERVICE',
  PROCUREMENT_SERVICE = 'PROCUREMENT_SERVICE',
  FINANCE_SERVICE = 'FINANCE_SERVICE',
  PARTY_SERVICE = 'PARTY_SERVICE',
  MES_SERVICE = 'MES_SERVICE',
  WMS_SERVICE = 'WMS_SERVICE',
  ASSET_SERVICE = 'ASSET_SERVICE',
  NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE'
}

export namespace PermissionModule {
  export function from(value: string): PermissionModule {
    if (!Object.values(PermissionModule).includes(value as PermissionModule)) {
      throw new Error(value)
    }
    return value as PermissionModule
  }
}
