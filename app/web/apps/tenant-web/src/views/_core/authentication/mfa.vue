<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Checkbox, message, Tooltip } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import MfaBackupCodePanel from './mfa-backup-code-panel.vue';
import MfaEmailOtpPanel from './mfa-email-otp-panel.vue';
import MfaSmsOtpPanel from './mfa-sms-otp-panel.vue';
import MfaTotpPanel from './mfa-totp-panel.vue';

defineOptions({ name: 'CompleteMfa' });

const authStore = useAuthStore();
const router = useRouter();

const canResendOtpFactor = computed(
  () =>
    authStore.pendingMfaFactor === 'EMAIL_OTP'
    || authStore.pendingMfaFactor === 'SMS_OTP',
);

const currentFactorPanel = computed(() => {
  switch (authStore.pendingMfaFactor) {
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

const canCycleFactor = computed(() => authStore.pendingMfaAvailableFactors.length > 1);
const showTrustCurrentDevice = computed(
  () => authStore.pendingMfaScenario === 'NEW_DEVICE_LOGIN',
);
const trustCurrentDeviceFlag = ref(false);
const showNewDeviceNotice = ref(false);

watch(
  showTrustCurrentDevice,
  (value) => {
    if (!value) {
      trustCurrentDeviceFlag.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => `${authStore.pendingChallengeId}:${authStore.pendingMfaScenario ?? ''}`,
  () => {
    showNewDeviceNotice.value =
      authStore.pendingMfaScenario === 'NEW_DEVICE_LOGIN'
      && Boolean(authStore.pendingChallengeId);
  },
  { immediate: true },
);

if (!authStore.pendingChallengeId) {
  message.warning('当前没有待完成的 MFA 挑战，请重新登录。');
  void router.replace({ name: 'Login' });
}

// Hosts the login-scene MFA flow and switches among factor-specific panels inside one route.
async function handleSubmit(code: string) {
  await authStore.completeMfa(code, {
    trustCurrentDevice: showTrustCurrentDevice.value ? trustCurrentDeviceFlag.value : undefined,
  });
}

async function handleResendCurrentFactor() {
  if (!authStore.pendingMfaFactor || authStore.pendingMfaResendCooldown > 0) {
    return;
  }

  await authStore.requestPendingMfaFactorChallenge(authStore.pendingMfaFactor);
}

async function handleCycleFactor() {
  await authStore.cyclePendingMfaFactor();
}

async function handleBackToLogin() {
  authStore.resetPendingAuthFlow();
  await router.replace({ name: 'Login' });
}

function handleBeginNewDeviceVerification() {
  showNewDeviceNotice.value = false;
}
</script>

<template>
  <div class="mfa-page">
    <div class="mfa-page__toolbar">
      <Button type="link" @click="handleBackToLogin">返回登录</Button>
    </div>
    <div v-if="showNewDeviceNotice" class="mfa-page__notice-card">
      <div class="mfa-page__notice-title">检测到这是一个新的设备</div>
      <div class="mfa-page__notice-text">
        当前租户已开启新设备登录保护。请确认是否信任当前设备，然后继续完成一次 MFA 验证。
      </div>
      <div class="mfa-page__notice-choice">
        <Checkbox v-model:checked="trustCurrentDeviceFlag">
          信任当前设备
        </Checkbox>
        <Tooltip title="勾选后，此设备在 30 天内登录当前租户时不再触发“新设备验证”。">
          <span class="mfa-page__trust-hint">30 天内跳过新设备验证</span>
        </Tooltip>
      </div>
      <Button block type="primary" @click="handleBeginNewDeviceVerification">
        继续验证
      </Button>
    </div>
    <template v-else>
      <Transition mode="out-in" name="mfa-panel">
        <component
          :is="currentFactorPanel"
          :key="authStore.pendingMfaFactor ?? 'UNKNOWN_FACTOR'"
          :destination="authStore.pendingMfaDestination"
          :has-active-challenge="Boolean(authStore.pendingMfaFactorChallengeId || authStore.pendingMfaDestination)"
          :loading="authStore.loginLoading"
          :resend-cooldown="canResendOtpFactor ? authStore.pendingMfaResendCooldown : 0"
          :can-cycle-factor="canCycleFactor"
          @cycle-factor="handleCycleFactor"
          @resend="handleResendCurrentFactor"
          @submit="handleSubmit"
        />
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.mfa-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
}

.mfa-page__toolbar {
  width: min(100%, 420px);
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.mfa-page__notice-card {
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.96) 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.mfa-page__notice-title {
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-color-text, rgba(0, 0, 0, 0.88));
}

.mfa-page__notice-text {
  width: 100%;
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  font-size: 13px;
  line-height: 1.7;
}

.mfa-page__notice-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mfa-page__trust-hint {
  color: var(--ant-color-text-description, rgba(0, 0, 0, 0.45));
  font-size: 12px;
  line-height: 1.5;
  cursor: help;
}

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
