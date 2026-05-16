<template>
  <section class="workbench-view">
    <header class="workbench-view__header">
      <div>
        <p class="eyebrow">FOUNDATION WORKBENCH</p>
        <h1>PDA 基础能力台</h1>
      </div>
      <div @touchstart.passive="markActionStart('session.logout')">
        <van-button plain size="small" type="primary" @click="logout">退出</van-button>
      </div>
    </header>

    <network-status-strip />

    <div class="workbench-grid">
      <device-status-card />
      <session-status-card />
      <scan-diagnostic-card />
      <camera-diagnostic-card />
      <log-diagnostic-card />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted, onUnmounted } from 'vue';
import CameraDiagnosticCard from '@/components/camera-diagnostic-card.vue';
import DeviceStatusCard from '@/components/device-status-card.vue';
import LogDiagnosticCard from '@/components/log-diagnostic-card.vue';
import NetworkStatusStrip from '@/components/network-status-strip.vue';
import ScanDiagnosticCard from '@/components/scan-diagnostic-card.vue';
import SessionStatusCard from '@/components/session-status-card.vue';
import { markActionPainted, markActionStart, markActionStep } from '@/diagnostics/performance-probe';
import { sendPdaHeartbeat, startPdaHeartbeat, stopPdaHeartbeat } from '@/services/pda-heartbeat';
import { useSessionStore } from '@/stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();

/** Revokes the PDA session when possible, then returns the operator to the login route. */
async function logout(): Promise<void> {
  markActionStep('session.logout', 'handler-start');
  await sendPdaHeartbeat('LOGOUT');
  await sessionStore.logout();
  markActionStep('session.logout', 'session-cleared');
  void router.push('/login').then(() => {
    markActionStep('session.logout', 'route-pushed');
    void markActionPainted('session.logout', 'painted');
  });
}

onMounted(() => {
  startPdaHeartbeat();
});

onUnmounted(() => {
  stopPdaHeartbeat();
});
</script>
