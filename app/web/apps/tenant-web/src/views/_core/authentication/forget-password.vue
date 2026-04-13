<script lang="ts" setup>
import AuthNotice from './auth-notice.vue';

defineOptions({ name: 'ForgetPassword' });
</script>

<template>
  <AuthNotice
    description="当前阶段暂未开放自助找回密码，请联系租户管理员或平台运维处理。"
    title="找回密码"
  />
</template>
