<script lang="ts" setup>
import { computed, reactive } from 'vue';

import { Button, Form, Input } from 'ant-design-vue';

import MfaSceneShell from './mfa-scene-shell.vue';

const props = defineProps<{
  canCycleFactor?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  cycleFactor: [];
  submit: [code: string];
}>();

// Renders the authenticator-app MFA step with TOTP-specific guidance and manual code entry.
const formState = reactive({
  code: '',
});

const canSubmit = computed(
  () => formState.code.trim().length === 6 && !props.loading,
);

async function handleSubmit() {
  if (!canSubmit.value) {
    return;
  }

  emit('submit', formState.code.trim());
}
</script>

<template>
  <MfaSceneShell
    :can-cycle-factor="canCycleFactor"
    help-text="打开已绑定的认证器应用，输入当前显示的 6 位动态验证码后继续登录。"
    title="验证认证器验证码"
    @cycle-factor="$emit('cycleFactor')"
  >
    <Form layout="vertical" @submit.prevent="handleSubmit">
      <Form.Item label="认证器验证码">
        <Input
          v-model:value="formState.code"
          inputmode="numeric"
          :maxlength="6"
          placeholder="请输入 6 位动态验证码"
          @press-enter="handleSubmit"
        />
      </Form.Item>

      <Button
        type="primary"
        block
        :disabled="!canSubmit"
        :loading="loading"
        @click="handleSubmit"
      >
        验证并继续
      </Button>
    </Form>
  </MfaSceneShell>
</template>
