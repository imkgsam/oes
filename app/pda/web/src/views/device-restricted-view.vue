<template>
  <section class="device-restricted-view">
    <div class="device-restricted-view__panel">
      <p class="eyebrow">DEVICE RESTRICTED</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <dl class="pda-card__facts">
        <dt>设备</dt>
        <dd>{{ sessionStore.terminalDeviceDisplayName || sessionStore.terminalDeviceId || '未绑定' }}</dd>
        <dt>状态</dt>
        <dd>{{ sessionStore.deviceStatus || sessionStore.decisionCode || 'UNKNOWN' }}</dd>
      </dl>
      <div class="pda-card__actions">
        <van-button plain type="primary" @click="retry">重试</van-button>
        <van-button v-if="canReEnroll" type="primary" @click="clearBinding">重新绑定</van-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();

const title = computed(() => {
  switch (sessionStore.decisionCode) {
    case 'DEVICE_DISABLED':
      return '此 PDA 已被禁用';
    case 'DEVICE_LOST':
      return '此 PDA 已标记丢失';
    case 'DEVICE_MAINTENANCE':
      return '此 PDA 处于维修状态';
    case 'DEVICE_DECOMMISSIONED':
      return '此 PDA 已退役';
    case 'DEVICE_PENDING_APPROVAL':
      return '此 PDA 等待审批';
    default:
      return '此 PDA 暂不可用';
  }
});

const description = computed(() =>
  sessionStore.decisionCode === 'DEVICE_PENDING_APPROVAL'
    ? '管理员审批后才能在现场登录使用。'
    : '请联系管理员处理设备状态，PDA 本地不能绕过设备治理。'
);
const canReEnroll = computed(() => sessionStore.decisionCode === 'DEVICE_DECOMMISSIONED');

/** Re-checks route guards after an administrator changes the managed device state. */
async function retry(): Promise<void> {
  await router.push('/login');
}

/** Clears a terminal binding only for terminal states that require a fresh enrollment. */
async function clearBinding(): Promise<void> {
  await sessionStore.clearSession();
  await sessionStore.clearTerminalDeviceBinding();
  await router.push('/enrollment');
}
</script>
