<script lang="ts" setup>
import { onMounted } from 'vue';

import { useAuthStore } from '#/store';

import AuthNotice from './auth-notice.vue';

defineOptions({ name: 'MfaFactorUnavailable' });

const authStore = useAuthStore();

onMounted(() => {
  authStore.clearAuthBlockReason();
});
</script>

<template>
  <AuthNotice
    title="当前无法完成登录"
    description="当前账号没有可用于本次登录验证的 MFA 因子。请返回登录页后改用密码登录完成二次验证，或先配置其他 MFA 因子。"
  />
</template>
