// File: src/services/system/permission-service/src/domain/enums/permission-module.enum.ts
export enum PermissionModule {
  ENTITY_SERVICE = 'ENTITY_SERVICE',
  IDENTITY_SERVICE = 'IDENTITY_SERVICE',
  PERMISSION_SERVICE = 'PERMISSION_SERVICE',
  AUTH_SERVICE = 'AUTH_SERVICE',
  EPR_SERVICE = 'EPR_SERVICE',
  MES_SERVICE = 'MES_SERVICE',
  WMS_SERVICE = 'WMS_SERVICE'
}

export namespace PermissionModule {
  export function from(value: string): PermissionModule {
    if (!Object.values(PermissionModule).includes(value as PermissionModule)) {
      throw new Error(value)
    }
    return value as PermissionModule
  }
}
