<template>
  <section class="login-view">
    <div class="login-view__panel">
      <div class="login-view__brand-row">
        <span class="login-view__logo" aria-hidden="true">
          <span class="login-view__logo-ring" />
          <span class="login-view__logo-scan" />
        </span>
        <p class="eyebrow">OES PDA TERMINAL</p>
      </div>
      <h1>PDA 登录</h1>

      <van-form v-if="loginMode === 'employeeCode'" class="login-form" @submit="handleEmployeeCodeSubmit">
        <van-field
          v-model="employeeCodeInput"
          label="工号"
          name="employeeCode"
          placeholder="扫码或输入工号"
          required
        >
          <template #right-icon>
            <button
              class="camera-scan-icon-button"
              type="button"
              aria-label="使用相机扫描员工码"
              :disabled="submitting || cameraScanning"
              @click.stop.prevent="openEmployeeCodeCameraScanner"
            >
              <van-icon name="scan" />
            </button>
          </template>
        </van-field>
        <p v-if="lastScanHint" class="login-form__hint">{{ lastScanHint }}</p>
        <p v-if="errorMessage" class="login-form__error">{{ errorMessage }}</p>
        <div @touchstart.passive="markActionStart('session.login')">
          <van-button block class="login-form__button" :loading="submitting" native-type="submit" type="primary">
            下一步
          </van-button>
        </div>
        <button class="login-form__link" type="button" @click="switchToPasswordLogin">使用账号密码登录</button>
      </van-form>

      <van-form v-else class="login-form" @submit="handlePasswordSubmit">
        <van-field v-model="account" label="账号" name="account" placeholder="请输入邮箱或手机号" required />
        <van-field v-model="password" label="密码" name="password" placeholder="请输入密码" required type="password" />
        <p v-if="errorMessage" class="login-form__error">{{ errorMessage }}</p>
        <div @touchstart.passive="markActionStart('session.login')">
          <van-button block class="login-form__button" :loading="submitting" native-type="submit" type="primary">
            进入 PDA
          </van-button>
        </div>
        <button class="login-form__link" type="button" @click="switchToEmployeeCodeLogin">返回员工码登录</button>
      </van-form>

    </div>

    <div v-if="pinPopupVisible" class="login-pin-unlock" role="dialog" aria-modal="true" aria-label="输入 Terminal PIN">
      <button
        class="login-pin-unlock__back"
        type="button"
        :disabled="submitting"
        @pointerdown.prevent="resetEmployeeCodeLogin"
      >
        返回
      </button>
      <div class="login-pin-unlock__stage">
        <div class="login-pin-unlock__dots" :aria-label="`已输入 ${pin.length} 位 PIN`">
          <span
            v-for="index in 6"
            :key="index"
            class="login-pin-unlock__dot"
            :class="{ 'login-pin-unlock__dot--filled': pin.length >= index }"
          />
        </div>
        <p v-if="pinErrorMessage" class="login-pin-unlock__error">{{ pinErrorMessage }}</p>
        <div v-else-if="submitting" class="login-pin-unlock__loading" role="status" aria-live="polite">
          <span class="login-pin-unlock__spinner" aria-hidden="true" />
          <span>验证中</span>
        </div>

        <div class="login-pin-unlock__keypad" aria-label="Terminal PIN 数字键盘">
          <button
            v-for="digit in pinDigits"
            :key="digit"
            class="login-pin-unlock__key"
            type="button"
            :disabled="submitting"
            @pointerdown.prevent="appendPinDigit(digit)"
          >
            {{ digit }}
          </button>
          <div class="login-pin-unlock__key-spacer" aria-hidden="true" />
          <button
            class="login-pin-unlock__key"
            type="button"
            :disabled="submitting"
            @pointerdown.prevent="appendPinDigit('0')"
          >
            0
          </button>
          <button
            class="login-pin-unlock__key login-pin-unlock__key--action"
            type="button"
            :disabled="submitting || pin.length === 0"
            @pointerdown.prevent="deletePinDigit"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchPdaBootstrap, loginPda, loginPdaWithEmployeeCodePin, preflightPdaEmployeeCodePin, toManagedPdaDeviceDescriptor } from '@/api/pda-bff.client';
import type { PdaLoginResponse } from '@/api/pda-bff.client';
import { getBridgeClient, onScanResult } from '@/bridge/bridge-client';
import { markActionPainted, markActionStart, markActionStep } from '@/diagnostics/performance-probe';
import { isCompleteTerminalPin, normalizeEmployeeCodeInput, parseEmployeeCodeScanInput } from '@/services/employee-code-login';
import { openCameraScanner } from '@/services/camera-scanner';
import { recordPdaDiagnosticLog } from '@/services/pda-diagnostic-log-buffer';
import { sendPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

type LoginMode = 'employeeCode' | 'password';

const loginMode = ref<LoginMode>('employeeCode');
const employeeCodeInput = ref('');
const normalizedEmployeeCode = ref('');
const account = ref('');
const password = ref('');
const errorMessage = ref('');
const pinErrorMessage = ref('');
const pin = ref('');
const lastScanHint = ref('');
const pinPopupVisible = ref(false);
const submitting = ref(false);
const cameraScanning = ref(false);
const pinDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const router = useRouter();
const sessionStore = useSessionStore();
let unsubscribeScan: (() => void) | undefined;

/** Routes login-only operators away from auth when the managed device is no longer allowed to log in. */
watch(
  () => sessionStore.decisionCode,
  (decisionCode) => {
    if (isRestrictedDeviceDecision(decisionCode)) {
      void router.push('/device-restricted');
    }
  },
);

/** Subscribes to PDA scan events and starts the employee-code PIN flow when a valid scan arrives. */
onMounted(() => {
  void refreshManagedDeviceDecisionOnLogin();
  unsubscribeScan = onScanResult((event) => {
    if (loginMode.value !== 'employeeCode') {
      return;
    }

    const employeeCode = parseEmployeeCodeScanInput(event.payload.scanValue);
    if (!employeeCode) {
      errorMessage.value = '请扫描员工条码。';
      return;
    }

    employeeCodeInput.value = employeeCode;
    normalizedEmployeeCode.value = employeeCode;
    lastScanHint.value = `已读取员工码 ${employeeCode}`;
    void preflightEmployeeCodeLogin(employeeCode);
    recordPdaDiagnosticLog({
      level: 'INFO',
      eventType: 'EMPLOYEE_CODE_SCAN_RECEIVED',
      message: 'Employee code scan received',
      requestId: event.eventId,
      diagnosticMode: true,
      details: {
        employeeCode,
        scanLength: event.payload.rawLength,
        scanSource: event.payload.scanSource,
      },
    });
  });
});

onBeforeUnmount(() => {
  unsubscribeScan?.();
});

/** Revalidates a bound but logged-out PDA before allowing any login attempt to proceed. */
async function refreshManagedDeviceDecisionOnLogin(): Promise<void> {
  const terminalDeviceBinding = sessionStore.loadTerminalDeviceBinding();
  if (!terminalDeviceBinding?.terminalDeviceId) {
    return;
  }

  await sendPdaHeartbeat('FOREGROUND');
}

/** Normalizes manually entered employee code and opens the popup PIN entry after backend preflight. */
async function handleEmployeeCodeSubmit(): Promise<void> {
  const employeeCode = normalizeEmployeeCodeInput(employeeCodeInput.value);
  employeeCodeInput.value = employeeCode;
  normalizedEmployeeCode.value = employeeCode;
  pinErrorMessage.value = '';

  if (!employeeCode) {
    errorMessage.value = '请输入员工码。';
    return;
  }

  errorMessage.value = '';
  await preflightEmployeeCodeLogin(employeeCode);
}

/** Verifies employee-code login readiness before asking the operator for a terminal PIN. */
async function preflightEmployeeCodeLogin(employeeCode: string): Promise<void> {
  submitting.value = true;
  try {
    const terminalDeviceBinding = await requireTerminalDeviceBinding();
    const deviceInfo = await resolveDeviceInfo();
    const result = await preflightPdaEmployeeCodePin({
      employeeCode,
      deviceName: await resolveDeviceName(),
      terminalDeviceId: terminalDeviceBinding.terminalDeviceId,
      device: toManagedPdaDeviceDescriptor(deviceInfo, terminalDeviceBinding.terminalDeviceId),
    });

    if (!result.allowed) {
      pinPopupVisible.value = false;
      pin.value = '';
      errorMessage.value = describeEmployeeCodePreflightDenial(result.reasonCode);
      recordPdaDiagnosticLog({
        level: 'WARN',
        eventType: 'EMPLOYEE_CODE_PREFLIGHT_DENIED',
        message: errorMessage.value,
        errorCode: result.reasonCode,
        diagnosticMode: true,
        details: { employeeCode },
      });
      return;
    }

    openPinPopup();
  } catch (error) {
    pinPopupVisible.value = false;
    pin.value = '';
    errorMessage.value = error instanceof Error ? error.message : '无法验证员工码，请检查网络后重试。';
    recordPdaDiagnosticLog({
      level: 'ERROR',
      eventType: 'EMPLOYEE_CODE_PREFLIGHT_FAILED',
      message: errorMessage.value,
      diagnosticMode: true,
      details: { employeeCode },
    });
  } finally {
    submitting.value = false;
  }
}

/** Opens the terminal PIN popup and prepares the number keyboard for a fresh PIN entry. */
function openPinPopup(): void {
  pin.value = '';
  errorMessage.value = '';
  pinErrorMessage.value = '';
  pinPopupVisible.value = true;
}

/** Clears the employee-code flow so the next scan or manual input starts from a clean code. */
function resetEmployeeCodeLogin(): void {
  employeeCodeInput.value = '';
  normalizedEmployeeCode.value = '';
  pin.value = '';
  errorMessage.value = '';
  pinErrorMessage.value = '';
  lastScanHint.value = '';
  pinPopupVisible.value = false;
}

/** Opens native camera scanning so phones without PDA scan heads can submit the same scanResult flow. */
async function openEmployeeCodeCameraScanner(): Promise<void> {
  errorMessage.value = '';
  cameraScanning.value = true;
  try {
    await openCameraScanner();
    lastScanHint.value = '请将员工码二维码或条码置于取景框内。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法打开相机扫码。';
  } finally {
    cameraScanning.value = false;
  }
}

/** Adds one keypad digit to the terminal PIN without invoking the Android soft keyboard. */
function appendPinDigit(digit: string): void {
  if (submitting.value || pin.value.length >= 6) {
    return;
  }

  pinErrorMessage.value = '';
  const nextPin = `${pin.value}${digit}`;
  pin.value = nextPin;

  if (isCompleteTerminalPin(nextPin)) {
    submitting.value = true;
    void handleEmployeeCodePinSubmit();
  }
}

/** Removes the most recent PIN digit from the custom lock-screen keypad. */
function deletePinDigit(): void {
  if (submitting.value || pin.value.length === 0) {
    return;
  }

  pinErrorMessage.value = '';
  pin.value = pin.value.slice(0, -1);
}

/** Switches to the legacy password fallback without changing its request behavior. */
function switchToPasswordLogin(): void {
  resetEmployeeCodeLogin();
  loginMode.value = 'password';
}

/** Returns the page to the default employee-code login mode. */
function switchToEmployeeCodeLogin(): void {
  errorMessage.value = '';
  loginMode.value = 'employeeCode';
}

/** Submits the six digit employee-code terminal PIN and keeps the popup active on credential failure. */
async function handleEmployeeCodePinSubmit(): Promise<void> {
  if (!isCompleteTerminalPin(pin.value)) {
    pinErrorMessage.value = '请输入 6 位数字 PIN。';
    return;
  }

  markActionStep('session.login', 'handler-start');
  errorMessage.value = '';
  pinErrorMessage.value = '';
  submitting.value = true;

  try {
    const terminalDeviceBinding = await requireTerminalDeviceBinding();
    const deviceInfo = await resolveDeviceInfo();
    const loginResult = await loginPdaWithEmployeeCodePin({
      employeeCode: normalizedEmployeeCode.value,
      pin: pin.value,
      deviceName: await resolveDeviceName(),
      terminalDeviceId: terminalDeviceBinding.terminalDeviceId,
      device: toManagedPdaDeviceDescriptor(deviceInfo, terminalDeviceBinding.terminalDeviceId),
    });

    if (!isSuccessfulLogin(loginResult)) {
      pin.value = '';
      pinErrorMessage.value = '员工码或 PIN 错误';
      errorMessage.value = '员工码或 PIN 错误';
      recordPdaDiagnosticLog({
        level: 'WARN',
        eventType: 'LOGIN_REJECTED',
        message: 'Employee code PIN login rejected',
        errorCode: loginResult.reasonCode ?? loginResult.nextStep,
        diagnosticMode: true,
        details: {
          status: loginResult.status,
          employeeCode: normalizedEmployeeCode.value,
          accountOptionCount: loginResult.accountOptions.length,
        },
      });
      return;
    }

    await completeSuccessfulLogin(loginResult, normalizedEmployeeCode.value, terminalDeviceBinding.terminalDeviceId);
  } catch (error) {
    pin.value = '';
    const message = error instanceof Error ? error.message : 'PDA 登录失败';
    pinErrorMessage.value = message;
    errorMessage.value = message;
    recordPdaDiagnosticLog({
      level: 'ERROR',
      eventType: 'LOGIN_FAILED',
      message: errorMessage.value,
      diagnosticMode: true,
      details: {
        employeeCode: normalizedEmployeeCode.value,
      },
    });
  } finally {
    submitting.value = false;
  }
}

/** Performs legacy PDA password auth through the existing BFF request shape. */
async function handlePasswordSubmit(): Promise<void> {
  markActionStep('session.login', 'handler-start');
  errorMessage.value = '';
  submitting.value = true;

  try {
    const terminalDeviceBinding = await requireTerminalDeviceBinding();
    const deviceInfo = await resolveDeviceInfo();
    const loginResult = await loginPda({
      identifier: account.value.trim(),
      credential: password.value,
      deviceName: await resolveDeviceName(),
      terminalDeviceId: terminalDeviceBinding.terminalDeviceId,
      device: toManagedPdaDeviceDescriptor(deviceInfo, terminalDeviceBinding.terminalDeviceId),
    });

    if (!isSuccessfulLogin(loginResult)) {
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

    await completeSuccessfulLogin(loginResult, account.value.trim(), terminalDeviceBinding.terminalDeviceId);
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

/** Ensures the PDA has an enrollment binding before any login method contacts auth. */
async function requireTerminalDeviceBinding() {
  const terminalDeviceBinding = sessionStore.loadTerminalDeviceBinding();
  if (!terminalDeviceBinding?.terminalDeviceId) {
    errorMessage.value = '此 PDA 尚未完成设备 enrollment，请先绑定设备。';
    await router.push('/enrollment');
    throw new Error(errorMessage.value);
  }

  return terminalDeviceBinding;
}

/** Finishes a successful auth response by storing tokens, loading bootstrap and opening workbench. */
async function completeSuccessfulLogin(
  loginResult: PdaLoginResponse,
  operatorFallback: string,
  terminalDeviceId: string,
): Promise<void> {
  if (!loginResult.session?.accessToken) {
    return;
  }

  await sessionStore.signIn(loginResult.session, loginResult.operator?.displayName || operatorFallback || 'PDA Operator');
  markActionStep('session.login', 'session-signed-in');

  const bootstrap = await fetchPdaBootstrap(loginResult.session.accessToken, terminalDeviceId);
  await sessionStore.applyBootstrap(bootstrap);
  markActionStep('session.login', 'bootstrap-loaded');
  void sendPdaHeartbeat('LOGIN');

  await router.push('/workbench');
  markActionStep('session.login', 'route-pushed');
  void markActionPainted('session.login', 'painted');
}

/** Checks the PDA auth success envelope before session initialization. */
function isSuccessfulLogin(loginResult: PdaLoginResponse): boolean {
  return loginResult.status === 'SUCCESS' && Boolean(loginResult.session?.accessToken);
}

async function resolveDeviceName(): Promise<string> {
  const result = await getBridgeClient().getDeviceInfo();
  if (!result.ok) {
    return 'OES PDA';
  }

  return `${result.data.manufacturer || 'PDA'} ${result.data.model || ''}`.trim();
}

/** Reads device identity facts required by the managed PDA login contract. */
async function resolveDeviceInfo() {
  const result = await getBridgeClient().getDeviceInfo();
  if (!result.ok) {
    throw new Error('无法读取 PDA 设备信息，请检查 Android Shell。');
  }

  return result.data;
}

function describePendingLoginStep(loginResult: PdaLoginResponse): string {
  if (loginResult.reasonCode === 'TERMINAL_ACCESS_DENIED') {
    return '该账号不允许登录 PDA，请检查 Terminal Access Policy。';
  }
  if (loginResult.nextStep === 'SELECT_ACCOUNT') {
    return '该账号无法在当前 PDA 绑定租户内建立唯一登录上下文，请联系管理员。';
  }
  if (loginResult.nextStep === 'COMPLETE_MFA') {
    return '该账号需要 MFA 验证，PDA Phase 1 暂未开放 MFA 流程。';
  }
  return '登录未完成，请检查账号权限或联系管理员。';
}

/** Maps employee-code preflight denial codes into restrained PDA operator guidance. */
function describeEmployeeCodePreflightDenial(reasonCode?: string): string {
  if (reasonCode === 'TERMINAL_PIN_NOT_CONFIGURED') {
    return '该员工尚未设置 PDA PIN，请先完成 PIN 设置。';
  }
  if (reasonCode === 'TERMINAL_PIN_RESET_REQUIRED') {
    return '该员工需要重置 PDA PIN 后再登录。';
  }
  if (reasonCode === 'DEVICE_BOUND_TENANT_REQUIRED' || reasonCode === 'TERMINAL_ACCESS_DENIED') {
    return '此 PDA 尚未获得当前租户登录权限，请联系管理员。';
  }
  return '该员工码不可用于 PDA 登录。';
}

function isRestrictedDeviceDecision(decisionCode: string | null): boolean {
  return (
    decisionCode === 'DEVICE_DISABLED' ||
    decisionCode === 'DEVICE_LOST' ||
    decisionCode === 'DEVICE_MAINTENANCE' ||
    decisionCode === 'DEVICE_DECOMMISSIONED' ||
    decisionCode === 'DEVICE_PENDING_APPROVAL'
  );
}
</script>
