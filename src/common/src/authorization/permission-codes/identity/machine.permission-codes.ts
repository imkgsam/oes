export const IDENTITY_MACHINE_PERMISSION_CODES = {
  CREATE_SERVICE_ACCOUNT: 'identity.machine.service_account.create',
  UPDATE_SERVICE_ACCOUNT_STATUS: 'identity.machine.service_account.update_status',
  CREATE_API_KEY: 'identity.machine.api_key.create',
  REVOKE_API_KEY: 'identity.machine.api_key.revoke',
  ROTATE_API_KEY: 'identity.machine.api_key.rotate'
} as const
