import { RawException } from '../../interfaces/exceptions.interface'

export const PERMISSION_SERVICE_ERRORS: Record<string, RawException> = {
  ROLE_NOT_FOUND: {
    subCode: '0001',
    message: 'Role not found',
    messageKey: 'permission.role_not_found',
    httpStatus: 404,
  },
  PERMISSION_NOT_FOUND: {
    subCode: '0002',
    message: 'Permission not found',
    messageKey: 'permission.permission_not_found',
    httpStatus: 404,
  },
}
