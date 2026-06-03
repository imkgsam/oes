<template>
  <section class="workbench-view">
    <header class="workbench-view__header">
      <div>
        <p class="eyebrow">FOUNDATION WORKBENCH</p>
        <h1>PDA 基础能力台</h1>
        <p v-if="refreshErrorMessage" class="workbench-view__error">{{ refreshErrorMessage }}</p>
      </div>
      <div class="workbench-view__actions">
        <div @touchstart.passive="markActionStart('session.refresh')">
          <van-button
            data-test-id="pda-workbench-refresh"
            :loading="refreshing"
            plain
            size="small"
            type="primary"
            @click="refreshWorkbench"
          >
            刷新工作台
          </van-button>
        </div>
        <van-button data-test-id="pda-open-mold-workbench" plain size="small" type="primary" @click="router.push('/molds')">
          模具作业
        </van-button>
        <div @touchstart.passive="markActionStart('session.logout')">
          <van-button plain size="small" type="primary" @click="logout">退出</van-button>
        </div>
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
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { fetchPdaBootstrap, PdaBffError } from '@/api/pda-bff.client';
import CameraDiagnosticCard from '@/components/camera-diagnostic-card.vue';
import DeviceStatusCard from '@/components/device-status-card.vue';
import LogDiagnosticCard from '@/components/log-diagnostic-card.vue';
import NetworkStatusStrip from '@/components/network-status-strip.vue';
import ScanDiagnosticCard from '@/components/scan-diagnostic-card.vue';
import SessionStatusCard from '@/components/session-status-card.vue';
import { markActionPainted, markActionStart, markActionStep } from '@/diagnostics/performance-probe';
import { sendPdaHeartbeat, startPdaHeartbeat, stopPdaHeartbeat } from '@/services/pda-heartbeat';
import { startPdaSessionLifecycle, stopPdaSessionLifecycle } from '@/services/pda-session-lifecycle';
import { useSessionStore } from '@/stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();
const refreshing = ref(false);
const refreshErrorMessage = ref('');

/** Sends the open workbench to the governed restricted surface as soon as a terminal denial arrives. */
watch(
  () => sessionStore.decisionCode,
  (decisionCode) => {
    if (isRestrictedDeviceDecision(decisionCode)) {
      void router.push('/device-restricted');
    }
  },
);

/** Revalidates the protected PDA session through bootstrap so revoked sessions clear local state promptly. */
async function refreshWorkbench(): Promise<void> {
  if (refreshing.value) {
    return;
  }

  refreshErrorMessage.value = '';
  const accessToken = sessionStore.accessToken;
  const terminalDeviceId = sessionStore.terminalDeviceId;
  if (!accessToken || !terminalDeviceId) {
    await sessionStore.clearSession();
    await router.push('/login');
    return;
  }

  refreshing.value = true;
  markActionStep('session.refresh', 'handler-start');
  try {
    const bootstrap = await fetchPdaBootstrap(accessToken, terminalDeviceId);
    await sessionStore.applyBootstrap(bootstrap);
    markActionStep('session.refresh', 'bootstrap-loaded');
    void sendPdaHeartbeat('SESSION_RESTORED');
    void markActionPainted('session.refresh', 'painted');
  } catch (error) {
    if (isAuthRejected(error)) {
      await sessionStore.clearSession();
      await router.push('/login');
      return;
    }

    refreshErrorMessage.value = error instanceof Error ? error.message : '刷新工作台失败，请稍后重试。';
    markActionStep('session.refresh', 'failed');
  } finally {
    refreshing.value = false;
  }
}

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
  startPdaSessionLifecycle({
    onIdleLogout: async () => {
      await router.push('/login');
    },
  });
});

onUnmounted(() => {
  stopPdaHeartbeat();
  stopPdaSessionLifecycle();
});

function isAuthRejected(error: unknown): boolean {
  const status =
    error instanceof PdaBffError || (error instanceof Error && 'status' in error)
      ? (error as { status?: number }).status
      : undefined;

  return status === 401 || status === 403;
}

function isRestrictedDeviceDecision(decisionCode: string | null): boolean {
  return (
    decisionCode === 'DEVICE_DISABLED' ||
    decisionCode === 'DEVICE_LOST' ||
    decisionCode === 'DEVICE_MAINTENANCE' ||
    decisionCode === 'DEVICE_DECOMMISSIONED' ||
    decisionCode === 'DEVICE_PENDING_APPROVAL'
  );
}
</script>
