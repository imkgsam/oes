import { ModuleDetails } from '../interfaces/module.interface'

export enum EXCEPTION_TYPE_PREFIX {
  SYSTEM = 'SYS',
  BUSINESS = 'BUS',
  RUNTIME = 'RT'
}

export const MODULES: Record<string, ModuleDetails> = {
  API_GATEWAY: {
    code: '101',
    name: 'API_GATEWAY'
  },
  AUTH_SERVICE: {
    code: '102',
    name: 'AUTH_SERVICE'
  },
  PERMISSION_SERVICE: {
    code: '103',
    name: 'PERMISSION_SERVICE'
  },
  IDENTITY_SERVICE: {
    code: '104',
    name: 'IDENTITY_SERVICE'
  },
  ERP_SERVICE: {
    code: '201',
    name: 'ERP_SERVICE'
  },
  MES_SERVICE: {
    code: '202',
    name: 'MES_SERVICE'
  }
}
