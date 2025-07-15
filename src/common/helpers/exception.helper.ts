import {
  EXCEPTION_TYPE_PREFIX,
  MODULES,
} from '../constants/res-codes/module_code_prefix'
import { ExceptionObject } from '../interfaces/exception-object.interface'
import { ModuleDetails } from '../interfaces/module-detail.interface'

export const genSystemExceptionObject = (
  moduleName: string,
  exception: ExceptionObject,
): ExceptionObject => {
  console.log('in genSystemExceptionObject', moduleName, exception)
  const foundModule: ModuleDetails = MODULES[moduleName]
  if (!foundModule) {
    throw new Error(`Module ${moduleName} not existed`)
  }
  const nE = {
    ...exception,
    prefixCode: `${EXCEPTION_TYPE_PREFIX.BUSINESS}${foundModule.code}`,
    module: foundModule.name,
  } as ExceptionObject

  return nE
}

export const genBusinessExceptionObject = (
  moduleName: string,
  exception: ExceptionObject,
): ExceptionObject => {
  console.log('in genBusinessExceptionObject', moduleName, exception)
  const foundModule: ModuleDetails = MODULES[moduleName]
  if (!foundModule) {
    throw new Error(`Module ${moduleName} not existed`)
  }
  const nE = {
    ...exception,
    prefixCode: `${EXCEPTION_TYPE_PREFIX.BUSINESS}${foundModule.code}`,
    module: foundModule.name,
  } as ExceptionObject

  return nE
}
