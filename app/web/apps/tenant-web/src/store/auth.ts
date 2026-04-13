import type { Recordable, UserInfo } from '@vben/types';

import type { AuthApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { message, notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  completeMfaApi,
  getSessionAccessSummaryApi,
  getSessionContextApi,
  loginApi,
  logoutApi,
  requestEmailOtpChallengeApi,
  requestPhoneOtpChallengeApi,
  selectAccountApi,
} from '#/api';
import { $t } from '#/locales';
import { useAuthContextStore } from '#/store/auth-context';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const authContextStore = useAuthContextStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const accountSelectionOptions = ref<AuthApi.AccountOptionPayload[]>([]);
  const pendingChallengeId = ref('');
  const pendingIdentifier = ref('');
  const pendingLoginMethod = ref<AuthApi.LoginMethod | null>(null);
  const pendingUserId = ref('');

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      pendingIdentifier.value = `${params.username ?? ''}`.trim();

      const result = await loginApi({
        credential: `${params.password ?? ''}`,
        identifier: pendingIdentifier.value,
        method: 'EMAIL_PASSWORD',
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: 'EMAIL_PASSWORD',
        });
        return { userInfo: null };
      }

      userInfo = await finalizeSuccessfulAuth(result, pendingIdentifier.value, onSuccess);
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function authPhonePasswordLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      pendingIdentifier.value = `${params.phoneNumber ?? ''}`.trim();

      const result = await loginApi({
        credential: `${params.password ?? ''}`,
        identifier: pendingIdentifier.value,
        method: 'PHONE_PASSWORD',
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: 'PHONE_PASSWORD',
        });
        return { userInfo: null };
      }

      userInfo = await finalizeSuccessfulAuth(
        result,
        pendingIdentifier.value,
        onSuccess,
      );
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function authCodeLogin(params: Recordable<any>) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      pendingIdentifier.value = `${params.phoneNumber ?? ''}`.trim();

      const result = await loginApi({
        credential: `${params.code ?? ''}`.trim(),
        identifier: pendingIdentifier.value,
        method: 'PHONE_OTP',
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: 'PHONE_OTP',
        });
        return { userInfo: null };
      }

      userInfo = await finalizeSuccessfulAuth(result, pendingIdentifier.value);
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  async function authEmailCodeLogin(params: Recordable<any>) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      pendingIdentifier.value = `${params.email ?? ''}`.trim();

      const result = await loginApi({
        credential: `${params.code ?? ''}`.trim(),
        identifier: pendingIdentifier.value,
        method: 'EMAIL_OTP',
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: 'EMAIL_OTP',
        });
        return { userInfo: null };
      }

      userInfo = await finalizeSuccessfulAuth(result, pendingIdentifier.value);
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  async function requestPhoneOtpChallenge(phoneNumber: string) {
    const phone = phoneNumber.trim();
    if (!phone) {
      throw new Error('请输入手机号');
    }
    const result = await requestPhoneOtpChallengeApi(phone);
    pendingIdentifier.value = phone;
    return result;
  }

  async function requestEmailOtpChallenge(emailAddress: string) {
    const email = emailAddress.trim();
    if (!email) {
      throw new Error('请输入邮箱地址');
    }
    const result = await requestEmailOtpChallengeApi(email);
    pendingIdentifier.value = email;
    return result;
  }

  async function completeMfa(code: string) {
    if (!pendingChallengeId.value || !pendingLoginMethod.value) {
      throw new Error('当前没有待处理的 MFA 挑战');
    }

    try {
      loginLoading.value = true;
      const result = await completeMfaApi({
        challengeId: pendingChallengeId.value,
        code: code.trim(),
        loginMethod: pendingLoginMethod.value,
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: pendingLoginMethod.value,
        });
        return { userInfo: null };
      }

      const userInfo = await finalizeSuccessfulAuth(
        result,
        pendingIdentifier.value,
      );
      return { userInfo };
    } finally {
      loginLoading.value = false;
    }
  }

  async function submitAccountSelection(accountId: string) {
    if (!pendingUserId.value || !pendingLoginMethod.value) {
      throw new Error('当前没有待处理的账户选择');
    }

    try {
      loginLoading.value = true;
      const result = await selectAccountApi({
        accountId,
        loginMethod: pendingLoginMethod.value,
        userId: pendingUserId.value,
      });

      if (result.status !== 'SUCCESS' || !result.session) {
        await handleIntermediateLoginState(result, {
          identityVerified: true,
          identifier: pendingIdentifier.value,
          loginMethod: pendingLoginMethod.value,
        });
        return { userInfo: null };
      }

      const userInfo = await finalizeSuccessfulAuth(
        result,
        pendingIdentifier.value,
      );
      return { userInfo };
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);
    resetPendingAuthFlow();

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    if (userStore.userInfo && authContextStore.sessionContext) {
      return userStore.userInfo as UserInfo;
    }
    if (!accessStore.accessToken) {
      throw new Error(
        'Current auth context is missing. Please login again to initialize the tenant web session.',
      );
    }

    const userInfo = await hydrateSessionContext(
      pendingIdentifier.value || userStore.userInfo?.username || '',
    );
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function buildUserInfo(
    identifier: string,
    operator?: {
      accountId?: string;
      accountName?: string;
      displayName?: string;
      scopeLevel?: 'SYSTEM' | 'TENANT';
      tenantId?: string;
      tenantName?: string;
      userId?: string;
    } | null,
    homePath?: string,
    roles: string[] = [],
  ): UserInfo {
    return {
      avatar: preferences.app.defaultAvatar,
      desc: buildUserDesc(operator),
      homePath: homePath || preferences.app.defaultHomePath,
      realName: operator?.displayName || identifier,
      roles,
      token: accessStore.accessToken || '',
      userId: operator?.userId || operator?.accountId || identifier,
      username: identifier,
    };
  }

  async function finalizeSuccessfulAuth(
    result: AuthApi.LoginResult,
    identifier: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    accessStore.setAccessToken(result.session!.accessToken);
    accessStore.setRefreshToken(result.session!.refreshToken);
    const userInfo = await hydrateSessionContext(
      identifier,
      result.operator ?? null,
    );
    userStore.setUserInfo(userInfo);
    resetPendingAuthFlow();

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else {
      onSuccess
        ? await onSuccess?.()
        : await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (userInfo.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
        message: $t('authentication.loginSuccess'),
      });
    }

    return userInfo;
  }

  async function hydrateSessionContext(
    identifier: string,
    operator?: {
      accountId?: string;
      displayName?: string;
      scopeLevel?: 'SYSTEM' | 'TENANT';
      tenantId?: string;
      userId?: string;
    } | null,
  ) {
    const [sessionContext, accessSummary] = await Promise.all([
      getSessionContextApi(),
      getSessionAccessSummaryApi(),
    ]);
    accessStore.setAccessCodes(accessSummary.actionCodes ?? []);
    authContextStore.setAuthContext(sessionContext, accessSummary);

    return buildUserInfo(
      identifier,
      {
        accountId: sessionContext.account?.accountId || operator?.accountId,
        accountName: sessionContext.account?.name,
        displayName:
          sessionContext.operator?.displayName ||
          sessionContext.account?.name ||
          operator?.displayName,
        tenantId: sessionContext.tenant?.tenantId || operator?.tenantId,
        tenantName: sessionContext.tenant?.name,
        userId: sessionContext.operator?.userId || operator?.userId,
        scopeLevel: sessionContext.scopeLevel || operator?.scopeLevel,
      },
      authContextStore.homePath,
      authContextStore.roleCodes,
    );
  }

  async function handleIntermediateLoginState(
    result: {
      accountOptions?: Array<{
        accountId: string;
        displayName?: string;
        scopeLevel?: 'SYSTEM' | 'TENANT';
        tenantId?: null | string;
      }>;
      challenge?: { challengeId: string } | null;
      nextStep?: string;
      operator?: { userId?: string } | null;
      status: string;
    },
    context: {
      identityVerified: boolean;
      identifier: string;
      loginMethod: AuthApi.LoginMethod;
    },
  ) {
    pendingIdentifier.value = context.identifier;
    pendingLoginMethod.value = context.loginMethod;

    switch (result.status) {
      case 'MFA_REQUIRED': {
        pendingChallengeId.value = result.challenge?.challengeId ?? '';
        await router.push({ name: 'CompleteMfa' });
        break;
      }
      case 'ACCOUNT_SELECTION_REQUIRED': {
        if (!context.identityVerified) {
          throw new Error('请先完成身份验证，再进行账户选择。');
        }
        accountSelectionOptions.value = result.accountOptions ?? [];
        pendingUserId.value = result.operator?.userId ?? '';
        await router.push({ name: 'AccountSelection' });
        break;
      }
      case 'DENIED': {
        throw new Error('登录被拒绝，请检查账号状态或认证信息。');
      }
      default: {
        message.info(
          `当前登录流程需要继续处理，下一步：${result.nextStep ?? 'UNKNOWN'}`,
        );
      }
    }
  }

  function resetPendingAuthFlow() {
    accountSelectionOptions.value = [];
    pendingChallengeId.value = '';
    pendingIdentifier.value = '';
    pendingLoginMethod.value = null;
    pendingUserId.value = '';
  }

  function buildUserDesc(
    operator?: {
      accountName?: string;
      scopeLevel?: 'SYSTEM' | 'TENANT';
      tenantName?: string;
    } | null,
  ) {
    if (operator?.scopeLevel === 'SYSTEM') {
      return operator.accountName ? `系统平台 / ${operator.accountName}` : 'OES system platform';
    }

    const parts = [operator?.tenantName, operator?.accountName]
      .map((value) => value?.trim())
      .filter(Boolean);

    return parts.length > 0 ? parts.join(' / ') : 'OES tenant user';
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    accountSelectionOptions,
    authEmailCodeLogin,
    authLogin,
    authCodeLogin,
    authPhonePasswordLogin,
    completeMfa,
    fetchUserInfo,
    loginLoading,
    logout,
    pendingChallengeId,
    pendingIdentifier,
    pendingLoginMethod,
    pendingUserId,
    requestEmailOtpChallenge,
    requestPhoneOtpChallenge,
    resetPendingAuthFlow,
    submitAccountSelection,
  };
});
