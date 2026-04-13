<script lang="ts" setup>
import AuthNotice from './auth-notice.vue';

defineOptions({ name: 'QrCodeLogin' });
</script>

<template>
  <AuthNotice
    description="当前阶段暂未开放扫码登录，请先使用邮箱密码或手机验证码登录。扫码登录能力将在后续终端协同方案稳定后接入。"
    title="扫码登录"
  />
</template>
