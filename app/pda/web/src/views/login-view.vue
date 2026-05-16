<template>
  <section class="login-view">
    <div class="login-view__panel">
      <p class="eyebrow">OES PDA TERMINAL</p>
      <h1>车间设备登录</h1>
      <p class="login-view__copy">一期仅开放账号密码登录；终端准入由后端策略判定，PDA Web 不保存刷新令牌。</p>

      <van-form class="login-form" @submit="handleSubmit">
        <van-field v-model="account" label="账号" name="account" placeholder="请输入邮箱或手机号" required />
        <van-field v-model="password" label="密码" name="password" placeholder="请输入密码" required type="password" />
        <p v-if="errorMessage" class="login-form__error">{{ errorMessage }}</p>
        <div @touchstart.passive="markActionStart('session.login')">
          <van-button block class="login-form__button" :loading="submitting" native-type="submit" type="primary">
            进入 PDA
          </van-button>
        </div>
      </van-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPdaBootstrap, loginPda, selectPdaAccount } from '@/api/pda-bff.client';
import type { PdaLoginResponse } from '@/api/pda-bff.client';
import { getBridgeClient } from '@/bridge/bridge-client';
import { markActionPainted, markActionStart, markActionStep } from '@/diagnostics/performance-probe';
import { recordPdaDiagnosticLog } from '@/services/pda-diagnostic-log-buffer';
import { sendPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

const account = ref('');
const password = ref('');
const errorMessage = ref('');
const submitting = ref(false);
const router = useRouter();
const sessionStore = useSessionStore();

/** Performs real PDA auth through the terminal-scoped BFF and initializes the workbench session. */
async function handleSubmit(): Promise<void> {
  markActionStep('session.login', 'handler-start');
  errorMessage.value = '';
  submitting.value = true;

  try {
    const deviceName = await resolveDeviceName();
    let loginResult = await loginPda({
      identifier: account.value.trim(),
      credential: password.value,
      deviceName,
    });

    if (loginResult.status === 'ACCOUNT_SELECTION_REQUIRED' && loginResult.accountOptions.length === 1) {
      if (!loginResult.operator?.userId) {
        errorMessage.value = '后端未返回用户信息，无法自动选择唯一账号。';
        return;
      }

      const onlyAccount = loginResult.accountOptions[0];
      markActionStep('session.login', 'single-account-auto-select');
      loginResult = await selectPdaAccount({
        userId: loginResult.operator.userId,
        accountId: onlyAccount.accountId,
        loginMethod: loginResult.loginMethod,
        deviceName,
      });
    }

    if (loginResult.status !== 'SUCCESS' || !loginResult.session?.accessToken) {
      errorMessage.value = loginResult.message || describePendingLoginStep(loginResult);
      recordPdaDiagnosticLog({
        level: 'WARN',
        eventType: 'LOGIN_REJECTED',
        message: errorMessage.value,
        errorCode: loginResult.reasonCode ?? loginResult.nextStep,
        diagnosticMode: true,
        details: {
          status: loginResult.status,
          accountOptionCount: loginResult.accountOptions.length,
        },
      });
      return;
    }

    await sessionStore.signIn(
      loginResult.session,
      loginResult.operator?.displayName || account.value.trim() || 'PDA Operator',
    );
    markActionStep('session.login', 'session-signed-in');

    const bootstrap = await fetchPdaBootstrap(loginResult.session.accessToken);
    sessionStore.applyBootstrap(bootstrap);
    markActionStep('session.login', 'bootstrap-loaded');
    void sendPdaHeartbeat('LOGIN');

    await router.push('/workbench');
    markActionStep('session.login', 'route-pushed');
    void markActionPainted('session.login', 'painted');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'PDA 登录失败';
    recordPdaDiagnosticLog({
      level: 'ERROR',
      eventType: 'LOGIN_FAILED',
      message: errorMessage.value,
      diagnosticMode: true,
    });
  } finally {
    submitting.value = false;
  }
}

async function resolveDeviceName(): Promise<string> {
  const result = await getBridgeClient().getDeviceInfo();
  if (!result.ok) {
    return 'OES PDA';
  }

  return `${result.data.manufacturer || 'PDA'} ${result.data.model || ''}`.trim();
}

function describePendingLoginStep(loginResult: PdaLoginResponse): string {
  if (loginResult.reasonCode === 'TERMINAL_ACCESS_DENIED') {
    return '该账号不允许登录 PDA，请检查 Terminal Access Policy。';
  }
  if (loginResult.nextStep === 'SELECT_ACCOUNT') {
    return '该账号需要选择租户/账号上下文，PDA Phase 1 暂未开放多账号选择。';
  }
  if (loginResult.nextStep === 'COMPLETE_MFA') {
    return '该账号需要 MFA 验证，PDA Phase 1 暂未开放 MFA 流程。';
  }
  return '登录未完成，请检查账号权限或联系管理员。';
}
</script>
