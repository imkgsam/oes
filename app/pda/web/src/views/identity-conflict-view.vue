<template>
  <section class="identity-conflict-view">
    <div class="identity-conflict-view__panel">
      <p class="eyebrow">IDENTITY CONFLICT</p>
      <h1>设备身份需要管理员确认</h1>
      <p>当前 PDA 上报的硬件身份与后台设备登记不一致。为保护租户边界，请停止登录并联系管理员重新核对设备。</p>
      <div class="pda-card__actions">
        <van-button plain type="primary" @click="retry">重新检查</van-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

/** Returns to login so the next bootstrap or heartbeat can re-evaluate device identity. */
async function retry(): Promise<void> {
  await router.push('/login');
}
</script>
