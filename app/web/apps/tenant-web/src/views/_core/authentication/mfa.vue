<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { Button, message, Tag } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'CompleteMfa' });

const authStore = useAuthStore();
const router = useRouter();
const codeLength = computed(() =>
  authStore.pendingMfaFactor === 'BACKUP_CODE' ? 8 : 6,
);

const factorLabel = computed(() => {
  switch (authStore.pendingMfaFactor) {
    case 'EMAIL_OTP':
      return '邮箱验证码';
    case 'SMS_OTP':
      return '手机验证码';
    case 'BACKUP_CODE':
      return '恢复码';
    case 'TOTP':
    default:
      return '认证器验证码';
  }
});

const subTitle = computed(() => {
  switch (authStore.pendingMfaFactor) {
    case 'EMAIL_OTP':
      return '请输入邮箱收到的验证码';
    case 'SMS_OTP':
      return '请输入手机收到的验证码';
    case 'BACKUP_CODE':
      return '请输入恢复码';
    case 'TOTP':
    default:
      return '请输入认证器中的验证码';
  }
});

const canResendOtpFactor = computed(
  () =>
    authStore.pendingMfaFactor === 'EMAIL_OTP'
    || authStore.pendingMfaFactor === 'SMS_OTP',
);

const resendButtonText = computed(() => {
  if (!canResendOtpFactor.value) {
    return '';
  }

  return authStore.pendingMfaResendCooldown > 0
    ? `${authStore.pendingMfaResendCooldown}s 后重发`
    : '重新发送验证码';
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: codeLength.value,
        placeholder: factorLabel.value,
      },
      fieldName: 'code',
      label: factorLabel.value,
      rules: z.string().length(codeLength.value, {
        message: `请输入 ${codeLength.value} 位验证码`,
      }),
    },
  ];
});

if (!authStore.pendingChallengeId) {
  message.warning('当前没有待完成的 MFA 挑战，请重新登录。');
  void router.replace({ name: 'Login' });
}

async function handleSubmit(values: Recordable<any>) {
  await authStore.completeMfa(`${values.code ?? ''}`);
}

async function handleSwitchFactor(factor: 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP') {
  await authStore.switchPendingMfaFactor(factor);
}

async function handleResendCurrentFactor() {
  if (!authStore.pendingMfaFactor || authStore.pendingMfaResendCooldown > 0) {
    return;
  }

  await authStore.switchPendingMfaFactor(authStore.pendingMfaFactor);
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="authStore.pendingMfaAvailableFactors.length > 0"
      class="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div class="mb-3 flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">验证方式</span>
        <Tag color="blue">{{ factorLabel }}</Tag>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          v-for="factor in authStore.pendingMfaAvailableFactors"
          :key="factor.type"
          :disabled="authStore.loginLoading"
          :type="factor.type === authStore.pendingMfaFactor ? 'primary' : 'default'"
          size="small"
          @click="handleSwitchFactor(factor.type)"
        >
          {{ factor.label }}
        </Button>
      </div>

      <div
        v-if="authStore.pendingMfaDestination"
        class="mt-3 text-xs text-muted-foreground"
      >
        当前验证码已发送至 {{ authStore.pendingMfaDestination }}
      </div>

      <div v-if="canResendOtpFactor" class="mt-3">
        <Button
          :disabled="authStore.loginLoading || authStore.pendingMfaResendCooldown > 0"
          size="small"
          @click="handleResendCurrentFactor"
        >
          {{ resendButtonText }}
        </Button>
      </div>
    </div>

    <AuthenticationCodeLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-back="true"
      :sub-title="subTitle"
      title="完成二次验证"
      @submit="handleSubmit"
    />
  </div>
</template>
