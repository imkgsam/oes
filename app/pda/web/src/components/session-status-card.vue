<template>
  <article class="pda-card pda-card--accent">
    <p class="pda-card__label">会话</p>
    <h2>{{ sessionStore.operatorName || '未登录' }}</h2>
    <p>{{ description }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSessionStore } from '@/stores/session.store';

const sessionStore = useSessionStore();
const description = computed(() => {
  if (!sessionStore.isAuthenticated) {
    return '等待登录';
  }

  const tenantId = sessionStore.bootstrap?.account?.tenantId;
  return tenantId ? `PDA session 已建立 / tenant ${tenantId}` : 'PDA session 已建立';
});
</script>
