<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { SliderCaptcha } from '@vben/common-ui';

import { Button, Form, Input } from 'ant-design-vue';

import MfaSceneShell from './mfa-scene-shell.vue';
import { maskMfaDestination } from './mfa.helpers';

const props = defineProps<{
  canCycleFactor?: boolean;
  destination?: string;
  hasActiveChallenge?: boolean;
  loading?: boolean;
  resendCooldown?: number;
}>();

const emit = defineEmits<{
  cycleFactor: [];
  resend: [];
  submit: [code: string];
}>();

// Renders the SMS-OTP MFA step with mobile-specific delivery messaging and resend controls.
const formState = reactive({
  code: '',
});
const captchaVerified = ref(false);
const showCaptchaPanel = ref(false);
const sliderVersion = ref(0);

const canSubmit = computed(
  () => props.hasActiveChallenge && formState.code.trim().length === 6 && !props.loading,
);

const resendButtonText = computed(() => {
  return props.resendCooldown && props.resendCooldown > 0
    ? `${props.resendCooldown}s 后重发`
    : '重新发送验证码';
});

const maskedDestination = computed(() =>
  maskMfaDestination(props.destination) || '当前绑定手机号',
);

watch(
  () => props.hasActiveChallenge,
  (hasChallenge) => {
    if (hasChallenge) {
      captchaVerified.value = false;
      showCaptchaPanel.value = false;
      sliderVersion.value += 1;
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!canSubmit.value) {
    return;
  }

  emit('submit', formState.code.trim());
}

function openCaptchaGate() {
  showCaptchaPanel.value = true;
  captchaVerified.value = false;
  sliderVersion.value += 1;
}

async function handleCaptchaSuccess() {
  captchaVerified.value = true;
  showCaptchaPanel.value = false;
  emit('resend');
}
</script>

<template>
  <MfaSceneShell
    :can-cycle-factor="canCycleFactor"
    help-text="输入手机收到的 6 位验证码，确认当前登录操作属于你本人。"
    highlight-label="验证码已发送至"
    highlight-tone="green"
    :highlight-value="maskedDestination"
    :show-highlight="Boolean(hasActiveChallenge)"
    title="验证短信验证码"
    @cycle-factor="$emit('cycleFactor')"
  >
    <Form layout="vertical" @submit.prevent="handleSubmit">
      <Form.Item v-if="hasActiveChallenge" label="短信验证码">
        <Input
          v-model:value="formState.code"
          inputmode="numeric"
          :maxlength="6"
          placeholder="请输入 6 位验证码"
          @press-enter="handleSubmit"
        />
      </Form.Item>

      <div class="mfa-factor-actions">
        <Button
          type="primary"
          block
          :disabled="!canSubmit"
          :loading="loading"
          @click="handleSubmit"
        >
          验证并继续
        </Button>

        <Button
          v-if="hasActiveChallenge"
          block
          :disabled="loading || (resendCooldown ?? 0) > 0"
          @click="openCaptchaGate"
        >
          {{ resendButtonText }}
        </Button>
      </div>

      <div
        v-if="!hasActiveChallenge || showCaptchaPanel"
        class="mfa-factor-captcha"
      >
        <SliderCaptcha
          :key="sliderVersion"
          v-model="captchaVerified"
          success-text="验证通过"
          text="请按住滑块拖动"
          @success="handleCaptchaSuccess"
        />
      </div>
    </Form>
  </MfaSceneShell>
</template>

<style scoped>
.mfa-factor-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mfa-factor-captcha {
  margin-top: 16px;
}
</style>
