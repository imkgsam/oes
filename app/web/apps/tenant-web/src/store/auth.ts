import type { Recordable, UserInfo } from '@vben/types';

import type { AuthApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import {
  resetAllStores,
  useAccessStore,
  useTabbarStore,
  useUserStore,
} from '@vben/stores';

import { message, notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  completeFirstLoginPasswordSetupApi,
  completeMfaApi,
  getSessionAccessSummaryApi,
  getSessionContextApi,
  loginApi,
  logoutApi,
  requestEmailOtpChallengeApi,
  requestMfaFactorChallengeApi,
  requestPhoneOtpChallengeApi,
  selectAccountApi,
  switchSessionContextApi,
} from '#/api';
import { $t } from '#/locales';
import { generateAccess } from '#/router/access';
import { accessRoutes } from '#/router/routes';
import { useAuthContextStore } from '#/store/auth-context';
import { resolveTestUserAvatar } from '#/store/test-user-avatar';
import { resolveAuthDeviceHints } from '#/utils/auth-device';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const authContextStore = useAuthContextStore();
  const tabbarStore = useTabbarStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const isLoggingOut = ref(false);
  const accountSelectionOptions = ref<AuthApi.AccountOptionPayload[]>([]);
  const pendingChallengeId = ref('');
  const pendingMfaFactor = ref<AuthApi.MfaFactor | null>(null);
  const pendingMfaFactorChallengeId = ref('');
  const pendingMfaAvailableFactors = ref<
    Array<{
      label: string;
      priority: number;
      type: AuthApi.MfaFactor;
    }>
  >([]);
  const pendingMfaDestination = ref('');
  const pendingMfaExpiresAt = ref('');
  const pendingMfaResendCooldown = ref(0);
  const pendingMfaScenario = ref<null | 'LOGIN' | 'NEW_DEVICE_LOGIN'>(null);
  const pendingIdentifier = ref('');
  const pendingLoginMethod = ref<AuthApi.LoginMethod | null>(null);
  const pendingUserId = ref('');
  const requiresPasswordSetup = ref(false);
  let pendingMfaCooldownTimer: null | ReturnType<typeof setInterval> = null;

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
        device: resolveAuthDeviceHints(),
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
        device: resolveAuthDeviceHints(),
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
        device: resolveAuthDeviceHints(),
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
        device: resolveAuthDeviceHints(),
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

  async function completeMfa(code: string, options?: { trustCurrentDevice?: boolean }) {
    if (!pendingChallengeId.value || !pendingLoginMethod.value || !pendingMfaFactor.value) {
      throw new Error('当前没有待处理的 MFA 挑战');
    }

    try {
      loginLoading.value = true;
      const result = await completeMfaApi({
        challengeId: pendingChallengeId.value,
        factor: pendingMfaFactor.value,
        code: code.trim(),
        factorChallengeId: pendingMfaFactorChallengeId.value || undefined,
        loginMethod: pendingLoginMethod.value,
        trustCurrentDevice: options?.trustCurrentDevice,
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

  async function switchPendingMfaFactor(factor: AuthApi.MfaFactor) {
    if (!pendingChallengeId.value) {
      throw new Error('当前没有待处理的 MFA 挑战');
    }

    pendingMfaFactor.value = factor;

    if (
      factor === 'TOTP'
      || factor === 'BACKUP_CODE'
      || factor === 'EMAIL_OTP'
      || factor === 'SMS_OTP'
    ) {
      pendingMfaFactorChallengeId.value = '';
      pendingMfaDestination.value = '';
      pendingMfaExpiresAt.value = '';
      stopPendingMfaCooldown();

      if (factor !== 'EMAIL_OTP' && factor !== 'SMS_OTP') {
        return;
      }
    }

    if (factor === 'EMAIL_OTP' || factor === 'SMS_OTP') {
      return;
    }

    const result = await requestMfaFactorChallengeApi({
      challengeId: pendingChallengeId.value,
      factor,
    });

    pendingMfaFactorChallengeId.value = result.challengeId;
    pendingMfaDestination.value = result.destination ?? '';
    pendingMfaExpiresAt.value = result.expiresAt ?? '';
    startPendingMfaCooldown();
  }

  async function requestPendingMfaFactorChallenge(
    factor: AuthApi.MfaFactor = pendingMfaFactor.value as AuthApi.MfaFactor,
  ) {
    if (!pendingChallengeId.value || !factor) {
      throw new Error('当前没有待处理的 MFA 挑战');
    }

    if (factor === 'TOTP' || factor === 'BACKUP_CODE') {
      pendingMfaFactorChallengeId.value = '';
      pendingMfaDestination.value = '';
      pendingMfaExpiresAt.value = '';
      stopPendingMfaCooldown();
      return;
    }

    const result = await requestMfaFactorChallengeApi({
      challengeId: pendingChallengeId.value,
      factor,
    });

    pendingMfaFactor.value = factor;
    pendingMfaFactorChallengeId.value = result.challengeId;
    pendingMfaDestination.value = result.destination ?? '';
    pendingMfaExpiresAt.value = result.expiresAt ?? '';
    startPendingMfaCooldown();
  }

  async function cyclePendingMfaFactor() {
    if (pendingMfaAvailableFactors.value.length === 0) {
      throw new Error('当前没有可切换的 MFA 验证方式');
    }

    const currentIndex = pendingMfaAvailableFactors.value.findIndex(
      (factor) => factor.type === pendingMfaFactor.value,
    );
    const nextIndex =
      currentIndex >= 0
        ? (currentIndex + 1) % pendingMfaAvailableFactors.value.length
        : 0;

    await switchPendingMfaFactor(
      pendingMfaAvailableFactors.value[nextIndex]!.type,
    );
  }

  async function submitAccountSelection(accountId: string) {
    if (!pendingUserId.value || !pendingLoginMethod.value) {
      throw new Error('当前没有待处理的账户选择');
    }

    try {
      loginLoading.value = true;
      const result = await selectAccountApi({
        accountId,
        device: resolveAuthDeviceHints(),
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
    if (isLoggingOut.value) {
      return;
    }

    isLoggingOut.value = true;
    try {
      if (accessStore.accessToken) {
        await logoutApi();
      }
    } catch {
      // 不做任何处理
    } finally {
      isLoggingOut.value = false;
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

  async function fetchUserInfo(forceRefresh = false) {
    if (!forceRefresh && userStore.userInfo) {
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

  // Refreshes the authenticated session navigation state after governance changes update visibility or landing.
  async function refreshCurrentSessionAccess() {
    if (!accessStore.accessToken) {
      return;
    }

    const userInfo = await hydrateSessionContext(
      pendingIdentifier.value || userStore.userInfo?.username || '',
    );
    userStore.setUserInfo(userInfo);
    await rebuildAccessState(userInfo.roles ?? []);

    const currentEntryKey =
      typeof router.currentRoute.value.meta?.entryKey === 'string'
        ? router.currentRoute.value.meta.entryKey
        : undefined;

    if (
      currentEntryKey &&
      !authContextStore.visibleEntries.includes(currentEntryKey)
    ) {
      await router.replace(authContextStore.homePath);
    }
  }

  function buildUserInfo(
    identifier: string,
    operator?: {
      accountId?: string;
      accountAvatar?: string;
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
      avatar:
        operator?.accountAvatar
        || resolveTestUserAvatar(
          preferences.app.defaultAvatar,
          operator?.userId,
        ),
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
    requiresPasswordSetup.value =
      result.passwordSetupRequired === true
      || authContextStore.sessionContext?.passwordSetupRequired === true;
    userStore.setUserInfo(userInfo);
    resetPendingAuthFlow();

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else if (requiresPasswordSetup.value) {
      await router.push({ name: 'FirstLoginPasswordSetup' });
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

  async function switchAccountContext(accountId: string) {
    try {
      const result = await switchSessionContextApi({
        accountId: accountId.trim(),
        device: resolveAuthDeviceHints(),
      })

      if (result.status !== 'SUCCESS' || !result.session) {
        throw new Error(result.message || '账号切换失败，请刷新后重试。')
      }

      accessStore.setAccessToken(result.session.accessToken)
      accessStore.setRefreshToken(result.session.refreshToken)

      const userInfo = await hydrateSessionContext(
        userStore.userInfo?.username ||
          pendingIdentifier.value ||
          'context-switch',
        {
          accountId: result.context?.accountId,
          scopeLevel: result.context?.scopeLevel,
          tenantId: result.context?.tenantId || undefined,
          userId: authContextStore.sessionContext?.operator?.userId,
        },
      )

      userStore.setUserInfo(userInfo)
      tabbarStore.resetForContextSwitch()
      await rebuildAccessState(userInfo.roles ?? [])

      const targetPath = userInfo.homePath || preferences.app.defaultHomePath
      const currentPath = router.currentRoute.value.path

      if (currentPath === targetPath) {
        window.location.replace(targetPath)
        return userInfo
      }

      await router.replace(targetPath)
      message.success('已切换到新的账号')
      return userInfo
    } catch (error: any) {
      const violations =
        error?.details?.violations ?? error?.response?.data?.details?.violations
      if (Array.isArray(violations) && violations.length > 0) {
        message.error(
          violations
            .map((item: any) =>
              [
                item.property,
                item.constraints
                  ? Object.values(item.constraints).join(', ')
                  : item.message,
              ]
                .filter(Boolean)
                .join(': '),
            )
            .join(' ; '),
        )
      }
      throw error
    }
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
    requiresPasswordSetup.value = sessionContext.passwordSetupRequired === true;

    return buildUserInfo(
      identifier,
      {
        accountId: sessionContext.account?.accountId || operator?.accountId,
        accountAvatar: sessionContext.account?.avatar,
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
    )
  }

  async function rebuildAccessState(userRoles: string[]) {
    accessStore.setAccessMenus([])
    accessStore.setAccessRoutes([])
    accessStore.setIsAccessChecked(false)

    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      routes: accessRoutes,
    })

    accessStore.setAccessMenus(accessibleMenus)
    accessStore.setAccessRoutes(accessibleRoutes)
    accessStore.setIsAccessChecked(true)
  }

  async function handleIntermediateLoginState(
    result: {
      accountOptions?: Array<{
        accountId: string;
        displayName?: string;
        scopeLevel?: 'SYSTEM' | 'TENANT';
        tenantId?: null | string;
        tenantName?: null | string;
      }>;
      challenge?: {
        availableFactors?: Array<{
          label: string;
          priority: number;
          type: AuthApi.MfaFactor;
        }>;
        challengeId: string;
        defaultFactor?: AuthApi.MfaFactor;
        destination?: string;
        expiresAt?: string;
        factorChallengeId?: string;
        scenario?: 'LOGIN' | 'NEW_DEVICE_LOGIN';
      } | null;
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
        const orderedAvailableFactors = normalizePendingMfaFactors(
          result.challenge?.availableFactors,
        );
        const defaultFactor = result.challenge?.defaultFactor ?? orderedAvailableFactors[0]?.type ?? null;

        pendingChallengeId.value = result.challenge?.challengeId ?? '';
        pendingMfaFactor.value = defaultFactor;
        pendingMfaFactorChallengeId.value = result.challenge?.factorChallengeId ?? '';
        pendingMfaAvailableFactors.value = orderedAvailableFactors;
        pendingMfaDestination.value = result.challenge?.destination ?? '';
        pendingMfaExpiresAt.value = result.challenge?.expiresAt ?? '';
        pendingMfaScenario.value = result.challenge?.scenario ?? 'LOGIN';
        if (
          (defaultFactor === 'EMAIL_OTP' || defaultFactor === 'SMS_OTP')
          && pendingMfaFactorChallengeId.value
        ) {
          startPendingMfaCooldown();
        } else {
          stopPendingMfaCooldown();
        }
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
    pendingMfaFactor.value = null;
    pendingMfaFactorChallengeId.value = '';
    pendingMfaAvailableFactors.value = [];
    pendingMfaDestination.value = '';
    pendingMfaExpiresAt.value = '';
    pendingMfaScenario.value = null;
    stopPendingMfaCooldown();
    pendingIdentifier.value = '';
    pendingLoginMethod.value = null;
    pendingUserId.value = '';
  }

  function startPendingMfaCooldown() {
    stopPendingMfaCooldown();
    pendingMfaResendCooldown.value = 60;
    pendingMfaCooldownTimer = setInterval(() => {
      if (pendingMfaResendCooldown.value <= 1) {
        stopPendingMfaCooldown();
        return;
      }

      pendingMfaResendCooldown.value -= 1;
    }, 1000);
  }

  function stopPendingMfaCooldown() {
    if (pendingMfaCooldownTimer) {
      clearInterval(pendingMfaCooldownTimer);
      pendingMfaCooldownTimer = null;
    }

    pendingMfaResendCooldown.value = 0;
  }

  async function completeFirstLoginPasswordSetup(params: {
    confirmPassword: string;
    newPassword: string;
  }) {
    await completeFirstLoginPasswordSetupApi({
      newPassword: `${params.newPassword ?? ''}`.trim(),
      confirmPassword: `${params.confirmPassword ?? ''}`.trim(),
    });

    requiresPasswordSetup.value = false;
    if (authContextStore.sessionContext) {
      authContextStore.sessionContext = {
        ...authContextStore.sessionContext,
        passwordSetupRequired: false,
      };
    }

    const targetPath =
      userStore.userInfo?.homePath ||
      authContextStore.homePath ||
      preferences.app.defaultHomePath;
    await router.replace(targetPath);
    message.success('密码已设置');
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

  function normalizePendingMfaFactors(
    factors?: Array<{
      label: string;
      priority: number;
      type: AuthApi.MfaFactor;
    }>,
  ) {
    return [...(factors ?? [])].sort((left, right) => {
      if (left.priority === right.priority) {
        return left.label.localeCompare(right.label, 'zh-Hans-CN');
      }

      return left.priority - right.priority;
    });
  }

  function $reset() {
    loginLoading.value = false;
    stopPendingMfaCooldown();
  }

  return {
    $reset,
    accountSelectionOptions,
    authEmailCodeLogin,
    authLogin,
    authCodeLogin,
    authPhonePasswordLogin,
    completeFirstLoginPasswordSetup,
    completeMfa,
    cyclePendingMfaFactor,
    fetchUserInfo,
    loginLoading,
    logout,
    pendingChallengeId,
    pendingMfaAvailableFactors,
    pendingMfaDestination,
    pendingMfaExpiresAt,
    pendingMfaFactor,
    pendingMfaFactorChallengeId,
    pendingMfaResendCooldown,
    pendingMfaScenario,
    pendingIdentifier,
    pendingLoginMethod,
    pendingUserId,
    requiresPasswordSetup,
    requestEmailOtpChallenge,
    requestPhoneOtpChallenge,
    refreshCurrentSessionAccess,
    requestPendingMfaFactorChallenge,
    resetPendingAuthFlow,
    switchPendingMfaFactor,
    submitAccountSelection,
    switchAccountContext,
  };
});
