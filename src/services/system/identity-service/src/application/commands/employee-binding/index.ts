export * from './bind-account-to-employee.command'
export * from './bind-account-to-employee.handler'
export * from './unbind-account-from-employee.command'
export * from './unbind-account-from-employee.handler'

import { BindAccountToEmployeeHandler } from './bind-account-to-employee.handler'
import { UnbindAccountFromEmployeeHandler } from './unbind-account-from-employee.handler'

export const EmployeeBindingCommandHandlers = [
  BindAccountToEmployeeHandler,
  UnbindAccountFromEmployeeHandler
]
