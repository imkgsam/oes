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

// Renders the recovery-code MFA step for fallback access when primary factors are unavailable.
const formState = reactive({
  code: '',
});

const canSubmit = computed(
  () => formState.code.trim().length === 8 && !props.loading,
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
    help-text="当你暂时无法使用邮箱、手机或认证器时，可输入一枚未使用过的恢复码完成登录。"
    title="输入恢复码"
    @cycle-factor="$emit('cycleFactor')"
  >
    <Form layout="vertical" @submit.prevent="handleSubmit">
      <Form.Item label="恢复码">
        <Input
          v-model:value="formState.code"
          :maxlength="8"
          placeholder="请输入 8 位恢复码"
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
