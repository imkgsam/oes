import { ModuleDetails } from '../../interfaces/module.interface'

export enum EXCEPTION_TYPE_PREFIX {
  SYSTEM = 'SYS',
  BUSINESS = 'BUS',
  RUNTIME = 'RT',
}

export const MODULES: Record<string, ModuleDetails> = {
  PERMISSION_SERVICE: {
    code: '101',
    name: 'PERMISSION_SERVICE',
  },
  AUTH_SERVICE: {
    code: '102',
    name: 'AUTH_SERVICE',
  },
  API_GATEWAY: {
    code: '103',
    name: 'API_GATEWAY',
  },
  IDENTITY_SERVICE: {
    code: '104',
    name: 'IDENTITY_SERVICE',
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
