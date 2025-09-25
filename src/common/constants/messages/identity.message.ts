export const IDENTITY_MESSAGES = {
  // USER
  CREATE_USER: 'identity.user.create',
  UPDATE_USER: 'identity.user.update',
  DELETE_USER: 'identity.user.delete',
  LIST_USERS: 'identity.user.list',
  GET_USER_BY_ID: 'identity.user.get_by_id',
  GET_USER_BY_EMAIL: 'identity.user.get_by_email',
  GET_USER_BY_PHONE: 'identity.user.get_by_phone',
  VALIDATE_USER: 'identity.user.validate',

  // ACCOUNT
  CREATE_ACCOUNT: 'identity.account.create',
  UPDATE_ACCOUNT: 'identity.account.update',
  DELETE_ACCOUNT: 'identity.account.delete',
  LIST_ACCOUNTS: 'identity.account.list',
  GET_ACCOUNT_BY_ID: 'identity.account.get_by_id',
  VALIDATE_ACCOUNT: 'identity.account.validate',
  GET_ACCOUNTS_BY_USER_ID: 'identity.account.get_by_user_id',

  //TENANT
  CREATE_TENANT: 'identity.tenant.create',
  UPDATE_TENANT: 'identity.tenant.update',
  DELETE_TENANT: 'identity.tenant.delete',
  LIST_TENANTS: 'identity.tenant.list',
  GET_TENANT_BY_ID: 'identity.tenant.get_by_id',
  VALIDATE_TENANT: 'identity.tenant.validate',

  //ORG
  CREATE_ORG: 'identity.org.create',
  UPDATE_ORG: 'identity.org.update',
  DELETE_ORG: 'identity.org.delete',
  LIST_ORGS: 'identity.org.list',

  // RELATIONS
  GET_USER_ACCOUNT_RELATIONS: 'identity.user.get_account_relations',
  GET_ACCOUNT_TENANT_RELATIONS: 'identity.account.get_tenant_relations',
  GET_USER_DEFAULT_ACCOUNT: 'identity.user.get_default_account',
  GET_ACCOUNT_DEFAULT_TENANT: 'identity.account.get_default_tenant',

  //test
  Test: 'identity.test'
}
