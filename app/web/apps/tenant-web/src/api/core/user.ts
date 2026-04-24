import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface SessionContextOption {
    accountId: string;
    displayName?: string;
    isCurrent: boolean;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: null | string;
    tenantName?: null | string;
  }

  export interface SessionContextListResult {
    items: SessionContextOption[];
  }

  export interface SwitchContextPayload {
    accountId: string;
    device?: {
      deviceId?: string;
      deviceName?: string;
    };
  }

  export interface SwitchedContext {
    accountId: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenantId?: null | string;
  }

  export interface SwitchContextSession {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
  }

  export interface SwitchContextResult {
    context?: null | SwitchedContext;
    message?: string;
    reasonCode?: string;
    session?: null | SwitchContextSession;
    status: 'DENIED' | 'SUCCESS';
  }

  export interface SessionContextOperator {
    displayName?: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    userId: string;
  }

  export interface SessionContextAccount {
    accountId: string;
    avatar?: string;
    name?: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
  }

  export interface SessionContextTenant {
    name?: string;
    tenantId: string;
  }

  export interface SessionContextOrg {
    name?: string;
    orgId: string;
  }

  export interface SessionContextNavigation {
    defaultEntry: string;
    defaultHomePath: string;
    menus: string[];
    visibleEntries: string[];
  }

  export interface SessionContextAccess {
    actionCodes: string[];
  }

  export interface SessionContext {
    access: SessionContextAccess;
    account: SessionContextAccount;
    navigation: SessionContextNavigation;
    operator: SessionContextOperator;
    org?: null | SessionContextOrg;
    passwordSetupRequired?: boolean;
    scopeLevel: 'SYSTEM' | 'TENANT';
    tenant?: null | SessionContextTenant;
  }

  export interface SessionAccessRole {
    code: string;
    name: string;
    roleId: string;
    scope: string;
    tenantId: string;
  }

  export interface SessionAccessSummary {
    actionCodes: string[];
    roles: SessionAccessRole[];
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return getSessionContextApi();
}

/**
 * 获取当前登录会话上下文
 */
export async function getSessionContextApi() {
  return requestClient.get<UserApi.SessionContext>('/auth/session/context');
}

/**
 * 获取当前登录会话权限摘要
 */
export async function getSessionAccessSummaryApi() {
  return requestClient.get<UserApi.SessionAccessSummary>(
    '/auth/session/access-summary',
  );
}

/**
 * 获取当前用户可切换的上下文列表
 */
export async function getSessionContextsApi() {
  return requestClient.get<UserApi.SessionContextListResult>(
    '/auth/session/contexts',
  );
}

/**
 * 切换当前登录上下文
 */
export async function switchSessionContextApi(
  data: UserApi.SwitchContextPayload,
) {
  return requestClient.post<UserApi.SwitchContextResult>(
    '/auth/session/switch-context',
    data,
  );
}
