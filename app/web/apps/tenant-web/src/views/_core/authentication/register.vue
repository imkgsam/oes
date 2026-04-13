<script lang="ts" setup>
import AuthNotice from './auth-notice.vue';

defineOptions({ name: 'Register' });
</script>

<template>
  <AuthNotice
    description="当前阶段不开放自助注册，OES 账号由租户管理员或平台管理员统一开通。"
    title="账号开通"
  />
</template>
