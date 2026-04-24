<script setup lang="ts">
import type { SelfSecurityApi } from '#/api';

import { computed, onBeforeUnmount, ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import {
  completeStepUpMfaChallengeApi,
  requestMfaFactorChallengeApi,
  startStepUpMfaChallengeApi,
} from '#/api';

import MfaBackupCodePanel from '../../authentication/mfa-backup-code-panel.vue';
import MfaEmailOtpPanel from '../../authentication/mfa-email-otp-panel.vue';
import MfaSmsOtpPanel from '../../authentication/mfa-sms-otp-panel.vue';
import MfaTotpPanel from '../../authentication/mfa-totp-panel.vue';

type MfaPanelFactor = SelfSecurityApi.MfaBindingType;

const open = ref(false);
const scenario = ref<SelfSecurityApi.StepUpMfaScenario>('CHANGE_PASSWORD');
const loading = ref(false);
const completing = ref(false);
const pendingChallengeId = ref('');
const currentFactor = ref<MfaPanelFactor>('TOTP');
const factorChallengeId = ref('');
const destination = ref('');
const expiresAt = ref('');
const availableFactors = ref<
  Array<{
    label: string;
    priority: number;
    type: MfaPanelFactor;
  }>
>([]);
const resendCooldown = ref(0);
let resendTimer: null | ReturnType<typeof setInterval> = null;
let resolvePending: ((value: null | string) => void) | null = null;

const currentFactorPanel = computed(() => {
  switch (currentFactor.value) {
    case 'BACKUP_CODE': {
      return MfaBackupCodePanel;
    }
    case 'EMAIL_OTP': {
      return MfaEmailOtpPanel;
    }
    case 'SMS_OTP': {
      return MfaSmsOtpPanel;
    }
    default: {
      return MfaTotpPanel;
    }
  }
});

const canCycleFactor = computed(() => availableFactors.value.length > 1);
const canResendOtpFactor = computed(
  () => currentFactor.value === 'EMAIL_OTP' || currentFactor.value === 'SMS_OTP',
);
const modalTitle = computed(() => {
  switch (scenario.value) {
    case 'CHANGE_CONTACT': {
      return '验证后继续更换绑定';
    }
    case 'NEW_DEVICE_LOGIN': {
      return '验证新设备登录';
    }
    default: {
      return '验证后继续修改密码';
    }
  }
});

function resetState() {
  open.value = false;
  loading.value = false;
  completing.value = false;
  pendingChallengeId.value = '';
  currentFactor.value = 'TOTP';
  factorChallengeId.value = '';
  destination.value = '';
  expiresAt.value = '';
  availableFactors.value = [];
  stopResendCooldown();
}

function stopResendCooldown() {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
  resendCooldown.value = 0;
}

function startResendCooldown() {
  stopResendCooldown();
  resendCooldown.value = 60;
  resendTimer = setInterval(() => {
    if (resendCooldown.value <= 1) {
      stopResendCooldown();
      return;
    }
    resendCooldown.value -= 1;
  }, 1000);
}

function resolveAndClose(value: null | string) {
  const resolver = resolvePending;
  resolvePending = null;
  resetState();
  resolver?.(value);
}

async function requestCurrentFactorChallenge() {
  if (!pendingChallengeId.value) {
    return;
  }

  loading.value = true;
  try {
    const result = await requestMfaFactorChallengeApi({
      challengeId: pendingChallengeId.value,
      factor: currentFactor.value,
    });

    factorChallengeId.value = result.challengeId ?? '';
    destination.value = result.destination ?? '';
    expiresAt.value = result.expiresAt ?? '';
    if (canResendOtpFactor.value) {
      startResendCooldown();
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '发送验证码失败');
  } finally {
    loading.value = false;
  }
}

async function cycleFactor() {
  if (availableFactors.value.length === 0) {
    return;
  }

  const currentIndex = availableFactors.value.findIndex(
    (factor) => factor.type === currentFactor.value,
  );
  const nextIndex =
    currentIndex === -1
      ? 0
      : (currentIndex + 1) % availableFactors.value.length;

  currentFactor.value = availableFactors.value[nextIndex]!.type;
  factorChallengeId.value = '';
  destination.value = '';
  expiresAt.value = '';
  stopResendCooldown();
}

async function submitFactor(code: string) {
  if (!pendingChallengeId.value) {
    return;
  }

  completing.value = true;
  try {
    const result = await completeStepUpMfaChallengeApi({
      challengeId: pendingChallengeId.value,
      factor: currentFactor.value,
      code,
      factorChallengeId: factorChallengeId.value || undefined,
    });

    if (!result.success) {
      message.error('安全验证未通过');
      return;
    }

    resolveAndClose(result.mfaGrantToken ?? '');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '安全验证失败');
  } finally {
    completing.value = false;
  }
}

async function beginChallenge(targetScenario: SelfSecurityApi.StepUpMfaScenario) {
  scenario.value = targetScenario;
  resetState();

  const result = await startStepUpMfaChallengeApi({
    scenario: targetScenario,
  });

  if (!result.required || !result.challenge) {
    return '';
  }

  pendingChallengeId.value = result.challenge.challengeId;
  currentFactor.value = result.challenge.defaultFactor ?? 'TOTP';
  factorChallengeId.value = result.challenge.factorChallengeId ?? '';
  destination.value = result.challenge.destination ?? '';
  expiresAt.value = result.challenge.expiresAt ?? '';
  availableFactors.value = result.challenge.availableFactors ?? [];
  open.value = true;

  return new Promise<null | string>((resolve) => {
    resolvePending = resolve;
  });
}

defineExpose({
  beginChallenge,
});

onBeforeUnmount(() => {
  stopResendCooldown();
  resolvePending = null;
});
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    :title="modalTitle"
    centered
    destroy-on-close
    width="480px"
    @cancel="resolveAndClose(null)"
  >
    <Transition mode="out-in" name="mfa-panel">
      <component
        :is="currentFactorPanel"
        :key="currentFactor"
        :can-cycle-factor="canCycleFactor"
        :destination="destination"
        :has-active-challenge="Boolean(factorChallengeId || destination)"
        :loading="loading || completing"
        :resend-cooldown="canResendOtpFactor ? resendCooldown : 0"
        @cycle-factor="cycleFactor"
        @resend="requestCurrentFactorChallenge"
        @submit="submitFactor"
      />
    </Transition>
  </Modal>
</template>

<style scoped>
.mfa-panel-enter-active,
.mfa-panel-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.mfa-panel-enter-from,
.mfa-panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
