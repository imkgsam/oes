import { requestClient } from '#/api/request';

export namespace AccountRoleManagementApi {
  export type AccountType = 'SERVICE' | 'USER';
  export type ScopeLevel = 'SYSTEM' | 'TENANT';

  export interface Role {
    code: string;
    description?: string;
    id: string;
    isEnabled: boolean;
    isSystem: boolean;
    name: string;
    roleKind: number | string;
    templateRoleId?: string;
    tenantId?: string;
  }

  export interface AccountRoleQuery {
    scopeLevel?: ScopeLevel;
    tenantId?: string;
  }

  export interface AccountRoleListResult {
    roles: Role[];
  }

  export interface AccountRoleSelectionResult {
    availableRoles: Role[];
    selectedRoleIds: string[];
  }

  export interface AssignAccountRolePayload {
    accountType: AccountType;
    effectiveAt?: string;
    expiresAt?: string;
    roleId: string;
    scopeLevel: ScopeLevel;
    tenantId?: string;
  }

  export interface SetAccountRolesPayload {
    accountType: AccountType;
    roleIds: string[];
    scopeLevel: ScopeLevel;
    tenantId?: string;
  }

  export interface RoleAccountBinding {
    accountId: string;
    accountType: AccountType;
    roleId: string;
    scopeLevel: ScopeLevel;
    tenantId?: string;
  }

  export interface RoleAccountBindingListResult {
    accounts: RoleAccountBinding[];
  }

  export interface AccountTerminalAccessQuery {
    scopeLevel: ScopeLevel;
    tenantId?: string;
  }

  export interface AccountTerminalAccess {
    accountId: string;
    effectiveAllowedTerminals: string[];
    hasOverride: boolean;
    scopeLevel: ScopeLevel;
    tenantId?: string;
  }

  export interface ReplaceAccountTerminalAccessOverridePayload
    extends AccountTerminalAccessQuery {
    allowedTerminals: string[];
  }
}

// Lists currently effective roles assigned to one account in a scope.
export async function listAccountRolesApi(
  accountId: string,
  params: AccountRoleManagementApi.AccountRoleQuery,
) {
  return requestClient.get<AccountRoleManagementApi.AccountRoleListResult>(
    `/account/${encodeURIComponent(accountId)}/roles`,
    { params },
  );
}

// Loads the assignable roles plus selected role ids for one account-role editor.
export async function getAccountRoleSelectionApi(
  accountId: string,
  params: AccountRoleManagementApi.AccountRoleQuery,
) {
  return requestClient.get<AccountRoleManagementApi.AccountRoleSelectionResult>(
    `/account/${encodeURIComponent(accountId)}/roles/selection`,
    { params },
  );
}

// Assigns one role to one account through the incremental account-role endpoint.
export async function assignAccountRoleApi(
  accountId: string,
  data: AccountRoleManagementApi.AssignAccountRolePayload,
) {
  return requestClient.post(
    `/account/${encodeURIComponent(accountId)}/roles`,
    data,
  );
}

// Replaces one account's complete role set in the requested scope.
export async function setAccountRolesApi(
  accountId: string,
  data: AccountRoleManagementApi.SetAccountRolesPayload,
) {
  return requestClient.request<AccountRoleManagementApi.AccountRoleListResult>(
    `/account/${encodeURIComponent(accountId)}/roles`,
    {
      data,
      method: 'PUT',
    },
  );
}

// Revokes one role from one account through the incremental account-role endpoint.
export async function revokeAccountRoleApi(accountId: string, roleId: string) {
  return requestClient.delete(
    `/account/${encodeURIComponent(accountId)}/roles/${encodeURIComponent(roleId)}`,
  );
}

// Lists account bindings that currently reference one role instance.
export async function listRoleAccountsApi(roleId: string) {
  return requestClient.get<AccountRoleManagementApi.RoleAccountBindingListResult>(
    `/role/${encodeURIComponent(roleId)}/accounts`,
  );
}

// Loads the effective terminal login access for one account in the selected scope.
export async function getAccountTerminalAccessApi(
  accountId: string,
  params: AccountRoleManagementApi.AccountTerminalAccessQuery,
) {
  return requestClient.get<AccountRoleManagementApi.AccountTerminalAccess>(
    `/account/${encodeURIComponent(accountId)}/terminal-access`,
    { params },
  );
}

// Replaces an account-level terminal access override for one account scope.
export async function replaceAccountTerminalAccessOverrideApi(
  accountId: string,
  data: AccountRoleManagementApi.ReplaceAccountTerminalAccessOverridePayload,
) {
  return requestClient.request<AccountRoleManagementApi.AccountTerminalAccess>(
    `/account/${encodeURIComponent(accountId)}/terminal-access/override`,
    {
      data,
      method: 'PUT',
    },
  );
}

// Deletes an account-level terminal access override so role defaults apply again.
export async function deleteAccountTerminalAccessOverrideApi(
  accountId: string,
  params: AccountRoleManagementApi.AccountTerminalAccessQuery,
) {
  return requestClient.delete(
    `/account/${encodeURIComponent(accountId)}/terminal-access/override`,
    { params },
  );
}
