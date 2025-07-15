import { ModuleDetails } from '../../interfaces/module.interface'

export enum EXCEPTION_TYPE_PREFIX {
  SYSTEM = 'SYS',
  BUSINESS = 'BUS',
}

export const MODULES: Record<string, ModuleDetails> = {
  PERMISSION_SERVICE: {
    code: '101',
    name: 'PERMISSION_SERVICE',
  },
  AUTH_SERVICE: {
    code: '1012',
    name: 'AUTH_SERVICE',
  },
  API_GATEWAY: {
    code: '103',
    name: 'API_GATEWAY',
  },
  ERP_SERVICE: {
    code: '201',
    name: 'ERP_SERVICE',
  },
  MES_SERVICE: {
    code: '202',
    name: 'MES_SERVICE',
  },
  EMAIL_SERVICE: {
    code: '301',
    name: 'EMAIL_SERVICE',
  },
}
