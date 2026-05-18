<template>
  <section class="enrollment-view">
    <div class="enrollment-view__panel">
      <p class="eyebrow">DEVICE ENROLLMENT</p>
      <h1>PDA 设备绑定</h1>
      <p class="enrollment-view__copy">扫描或输入管理员下发的 enrollment code。租户绑定由后台登记决定，PDA 不解析二维码里的租户信息。</p>

      <van-form class="enrollment-form" @submit="handleSubmit">
        <van-field
          v-model="enrollmentCode"
          label="Enrollment Code"
          name="enrollmentCode"
          placeholder="扫描或输入绑定码"
          required
        />
        <p v-if="lastScanHint" class="enrollment-form__hint">{{ lastScanHint }}</p>
        <p v-if="errorMessage" class="login-form__error">{{ errorMessage }}</p>
        <van-button block class="login-form__button" :loading="submitting" native-type="submit" type="primary">
          绑定设备
        </van-button>
      </van-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { enrollPdaDevice, toManagedPdaDeviceDescriptor } from '@/api/pda-bff.client';
import { getBridgeClient, onScanResult } from '@/bridge/bridge-client';
import { normalizeEnrollmentCodeInput } from '@/services/enrollment-code';
import { recordPdaDiagnosticLog } from '@/services/pda-diagnostic-log-buffer';
import { useSessionStore } from '@/stores/session.store';

const enrollmentCode = ref('');
const errorMessage = ref('');
const lastScanHint = ref('');
const submitting = ref(false);
const router = useRouter();
const sessionStore = useSessionStore();
let unsubscribeScan: (() => void) | undefined;

/** Subscribes to scanner input so operators can bind a PDA without typing long codes. */
onMounted(() => {
  unsubscribeScan = onScanResult((event) => {
    enrollmentCode.value = normalizeEnrollmentCodeInput(event.payload.scanValue);
    lastScanHint.value = `已读取扫码值，长度 ${event.payload.rawLength}`;
  });
});

onBeforeUnmount(() => {
  unsubscribeScan?.();
});

/** Activates enrollment and stores only the returned terminalDeviceId pointer locally. */
async function handleSubmit(): Promise<void> {
  const code = normalizeEnrollmentCodeInput(enrollmentCode.value);
  enrollmentCode.value = code;
  if (!code) {
    errorMessage.value = '请输入 enrollment code。';
    return;
  }

  errorMessage.value = '';
  submitting.value = true;
  try {
    const deviceInfo = await resolveDeviceInfo();
    const result = await enrollPdaDevice(code, toManagedPdaDeviceDescriptor(deviceInfo));
    await sessionStore.applyDeviceDecision(result.decision);

    if (!result.enrolled || !result.terminalDeviceId) {
      errorMessage.value = describeEnrollmentFailure(result.decision.decisionCode);
      recordPdaDiagnosticLog({
        level: 'WARN',
        eventType: 'ENROLLMENT_REJECTED',
        message: errorMessage.value,
        errorCode: result.decision.decisionCode,
        diagnosticMode: true,
      });
      return;
    }

    await sessionStore.setTerminalDeviceBinding({
      terminalDeviceId: result.terminalDeviceId,
      displayName: result.displayName,
      tenantId: result.tenantId,
      deviceStatus: result.deviceStatus ?? result.decision.deviceStatus ?? null,
    });
    await router.push(resolveRouteForDecision(result.decision.decisionCode));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '设备绑定失败。';
  } finally {
    submitting.value = false;
  }
}

/** Reads hardware identity from the Android shell before calling enrollment APIs. */
async function resolveDeviceInfo() {
  const result = await getBridgeClient().getDeviceInfo();
  if (!result.ok) {
    throw new Error('无法读取 PDA 设备信息，请检查 Android Shell。');
  }
  return result.data;
}

/** Converts managed enrollment decision codes into operator-facing PDA messages. */
function describeEnrollmentFailure(decisionCode: string): string {
  switch (decisionCode) {
    case 'ENROLLMENT_EXPIRED':
      return 'Enrollment code 已过期，请联系管理员重新下发。';
    case 'ENROLLMENT_USED':
      return 'Enrollment code 已被使用，请联系管理员核对设备。';
    case 'ENROLLMENT_REVOKED':
      return 'Enrollment code 已被撤销。';
    case 'DEVICE_IDENTITY_CONFLICT':
      return '设备身份与后台登记不一致，请联系管理员。';
    default:
      return '设备绑定未通过，请联系管理员。';
  }
}

/** Selects the first PDA route that matches the device governance decision. */
function resolveRouteForDecision(decisionCode: string): string {
  if (decisionCode === 'APP_VERSION_UNSUPPORTED') return '/version-blocked';
  if (decisionCode === 'DEVICE_IDENTITY_CONFLICT') return '/identity-conflict';
  if (decisionCode !== 'ALLOW') return '/device-restricted';
  return '/login';
}
</script>
