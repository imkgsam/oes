<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'CompleteMfa' });

const authStore = useAuthStore();
const router = useRouter();

const CODE_LENGTH = 6;

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        placeholder: 'MFA 验证码',
      },
      fieldName: 'code',
      label: 'MFA 验证码',
      rules: z.string().length(CODE_LENGTH, {
        message: `请输入 ${CODE_LENGTH} 位验证码`,
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
</script>

<template>
  <AuthenticationCodeLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-back="true"
    sub-title="请输入认证器或短信中收到的 MFA 验证码"
    title="完成二次验证"
    @submit="handleSubmit"
  />
</template>
