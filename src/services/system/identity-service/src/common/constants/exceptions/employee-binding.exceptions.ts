import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_EMPLOYEE_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_EMPLOYEE_NOT_FOUND',
  message: 'Employee not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.employee.not.found'
}

export const IDENTITY_ACCOUNT_TENANT_MISMATCH: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_TENANT_MISMATCH',
  message: 'Account tenant mismatch',
  rpcStatus: status.FAILED_PRECONDITION,
  messageKey: 'identity.account.tenant.mismatch'
}

export const IDENTITY_EMPLOYEE_TENANT_MISMATCH: ExceptionDefinition = {
  code: 'IDENTITY_EMPLOYEE_TENANT_MISMATCH',
  message: 'Employee tenant mismatch',
  rpcStatus: status.FAILED_PRECONDITION,
  messageKey: 'identity.employee.tenant.mismatch'
}

export const IDENTITY_EMPLOYEE_PARTY_MISMATCH: ExceptionDefinition = {
  code: 'IDENTITY_EMPLOYEE_PARTY_MISMATCH',
  message: 'Employee party mismatch',
  rpcStatus: status.FAILED_PRECONDITION,
  messageKey: 'identity.employee.party.mismatch'
}

export const IDENTITY_ACCOUNT_ALREADY_BOUND_TO_ANOTHER_EMPLOYEE: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_ALREADY_BOUND_TO_ANOTHER_EMPLOYEE',
  message: 'Account is already bound to another employee',
  rpcStatus: status.ALREADY_EXISTS,
  messageKey: 'identity.account.employee.binding.conflict'
}

export const IDENTITY_EMPLOYEE_ALREADY_BOUND_TO_ANOTHER_ACCOUNT: ExceptionDefinition = {
  code: 'IDENTITY_EMPLOYEE_ALREADY_BOUND_TO_ANOTHER_ACCOUNT',
  message: 'Employee is already bound to another account',
  rpcStatus: status.ALREADY_EXISTS,
  messageKey: 'identity.employee.account.binding.conflict'
}
