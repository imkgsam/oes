<template>
  <section class="version-blocked-view">
    <div class="version-blocked-view__panel">
      <p class="eyebrow">VERSION POLICY</p>
      <h1>当前 PDA 版本不可用</h1>
      <p>{{ description }}</p>
      <dl v-if="sessionStore.versionPolicy" class="pda-card__facts">
        <dt>最低版本</dt>
        <dd>{{ sessionStore.versionPolicy.minSupportedAppVersion }}</dd>
        <dt>最新版本</dt>
        <dd>{{ sessionStore.versionPolicy.latestAppVersion }}</dd>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session.store';

const sessionStore = useSessionStore();
const description = computed(() =>
  sessionStore.versionPolicy?.apkDownloadUrl
    ? '请联系管理员按企业分发策略安装受支持的 APK。'
    : '请联系管理员安装受支持的 APK。Phase 2 只消费版本策略，不做自动升级。'
);
</script>
