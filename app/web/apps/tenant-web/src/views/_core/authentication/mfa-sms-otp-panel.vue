<script lang="ts" setup>
import { computed, reactive } from 'vue';

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

const canSubmit = computed(
  () => props.hasActiveChallenge && formState.code.trim().length === 6 && !props.loading,
);
const canRequestChallenge = computed(
  () => !props.loading && (props.resendCooldown ?? 0) <= 0,
);

const resendButtonText = computed(() => {
  return props.resendCooldown && props.resendCooldown > 0
    ? `${props.resendCooldown}s 后重发`
    : '重新发送验证码';
});

const maskedDestination = computed(() =>
  maskMfaDestination(props.destination) || '当前绑定手机号',
);

async function handleSubmit() {
  if (!canSubmit.value) {
    return;
  }

  emit('submit', formState.code.trim());
}

async function handleRequestChallenge() {
  if (!canRequestChallenge.value) {
    return;
  }

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
          v-if="hasActiveChallenge"
          type="primary"
          block
          :disabled="!canSubmit"
          :loading="loading"
          @click="handleSubmit"
        >
          验证并继续
        </Button>

        <Button
          v-else
          type="primary"
          block
          :disabled="!canRequestChallenge"
          :loading="loading"
          @click="handleRequestChallenge"
        >
          发送验证码
        </Button>

        <Button
          v-if="hasActiveChallenge"
          block
          :disabled="loading || (resendCooldown ?? 0) > 0"
          @click="handleRequestChallenge"
        >
          {{ resendButtonText }}
        </Button>
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
</style>
