/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// Converts backend and transitional gateway error payloads into user-facing messages.
function resolveUserFacingErrorMessage(responseData: any, fallbackMessage: string) {
  const code = `${responseData?.code ?? ''}`;
  const messageText = `${responseData?.message ?? ''}`;
  const messageKey = `${responseData?.messageKey ?? ''}`;
  const originalMessage = `${responseData?.details?.originalMessage ?? ''}`;
  const originalDetails = `${responseData?.details?.originalDetails ?? ''}`;
  const combined = `${code} ${messageText} ${messageKey} ${originalMessage} ${originalDetails}`;

  if (/AUTH_INVALID_CREDENTIALS|Invalid credentials|auth\.invalid_credentials/i.test(combined)) {
    return '账号或密码错误，请检查后重试。';
  }

  if (/APP_VALIDATION_001|Request validation failed|app\.validation\.failed/i.test(combined)) {
    return '登录信息格式不正确，请检查后重试。';
  }

  if (/AUTH_LOGIN_TEMPORARILY_LOCKED|auth\.login_temporarily_locked/i.test(combined)) {
    return '登录失败次数过多，请稍后再试。';
  }

  return responseData?.error ?? responseData?.message ?? fallbackMessage;
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      await authStore.logout();
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    if (!accessStore.refreshToken) {
      throw new Error('Missing refresh token');
    }
    const session = await refreshTokenApi(accessStore.refreshToken);
    const tokenPayload = session.data;
    const newToken = tokenPayload?.accessToken;
    if (!newToken) {
      throw new Error('Refresh session response is missing access token');
    }
    accessStore.setAccessToken(newToken);
    accessStore.setRefreshToken(tokenPayload.refreshToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: (code) => code === 0 || code === 'SYS_000000',
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = resolveUserFacingErrorMessage(responseData, msg);
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
