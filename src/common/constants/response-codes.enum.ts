export enum ModuleTypeCode {
  SYSTEM = 0x1,
  BUSINESS = 0x2,
  AUXILIARY = 0x3,
  RESERVED = 0xF,
}

export enum ResponseCode {
  SUCCESS = 0x0,
}

export enum ModuleCode {
  AUTH = 0x1,
  PERMISSION = 0x2,
  USER = 0x3,
  ROLE = 0x4,
  MENU = 0x5,
  DICT = 0x6,
  FILE = 0x7,
  LOG = 0x8,
}