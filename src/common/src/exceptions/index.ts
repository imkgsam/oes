export * from '../core/exceptions'
export * from '../core/exceptions/exception.interface'
export * from '../core/exceptions/oes.exception'

import { ExceptionDefinition } from '../core/exceptions/exception.interface'
import { ExceptionFactory } from '../core/exceptions/exception.factory'

export type ExceptionConst = ExceptionDefinition & {
  subCode?: string
}

export const createBusinessException = (definition: ExceptionDefinition, internalDetails?: unknown) =>
  ExceptionFactory.domain(definition, internalDetails)

export const createSystemException = (definition: ExceptionDefinition, internalDetails?: unknown) =>
  ExceptionFactory.infrastructure(definition, internalDetails)
