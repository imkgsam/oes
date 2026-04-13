import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface SessionContextOperator {
    displayName?: string;
    scopeLevel: 'SYSTEM' | 'TENANT';
    userId: string;
  }

  export interface SessionContextAccount {
    accountId: string;
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
