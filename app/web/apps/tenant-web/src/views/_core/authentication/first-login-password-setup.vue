<script lang="ts" setup>
import { computed, reactive, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Form, Input } from 'ant-design-vue';

import { useAuthStore } from '#/store';
import { useAuthContextStore } from '#/store/auth-context';

defineOptions({ name: 'FirstLoginPasswordSetup' });

const authStore = useAuthStore();
const authContextStore = useAuthContextStore();
const router = useRouter();
const InputPassword = Input.Password;

const formState = reactive({
  confirmPassword: '',
  newPassword: '',
});

const canSubmit = computed(
  () =>
    formState.newPassword.trim().length >= 6
    && formState.confirmPassword.trim().length >= 6
    && !authStore.loginLoading,
);

watchEffect(() => {
  const hasToken = Boolean(authContextStore.sessionContext || authStore.requiresPasswordSetup);
  const stillRequired =
    authStore.requiresPasswordSetup
    || authContextStore.sessionContext?.passwordSetupRequired === true;

  if (!hasToken) {
    void router.replace({ name: 'Login' });
    return;
  }

  if (!stillRequired) {
    void router.replace(authContextStore.homePath || '/workbench/home');
  }
});

async function handleSubmit() {
  await authStore.completeFirstLoginPasswordSetup({
    newPassword: formState.newPassword,
    confirmPassword: formState.confirmPassword,
  });
}
</script>

<template>
  <div class="first-login-password-page">
    <div class="first-login-password-card">
      <div class="first-login-password-header">
        <h2>设置登录密码</h2>
        <p>首次登录已完成验证，继续设置密码后进入工作区。</p>
      </div>

      <Form layout="vertical" @submit.prevent="handleSubmit">
        <Form.Item label="新密码">
          <InputPassword
            v-model:value="formState.newPassword"
            autocomplete="new-password"
            placeholder="请输入至少 6 位密码"
          />
        </Form.Item>

        <Form.Item label="确认密码">
          <InputPassword
            v-model:value="formState.confirmPassword"
            autocomplete="new-password"
            placeholder="请再次输入密码"
            @press-enter="handleSubmit"
          />
        </Form.Item>

        <Button
          block
          type="primary"
          :disabled="!canSubmit"
          :loading="authStore.loginLoading"
          @click="handleSubmit"
        >
          确认并进入
        </Button>
      </Form>
    </div>
  </div>
</template>

<style scoped>
.first-login-password-page {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.first-login-password-card {
  width: min(100%, 420px);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.08);
  padding: 24px;
}

.first-login-password-header {
  margin-bottom: 20px;
}

.first-login-password-header h2 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 24px;
  font-weight: 600;
}

.first-login-password-header p {
  margin: 8px 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 14px;
  line-height: 1.6;
}
</style>
