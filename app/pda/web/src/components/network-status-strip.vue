<template>
  <aside class="network-strip">
    <span :class="['network-strip__dot', { 'network-strip__dot--online': online }]" />
    <span>{{ label }}</span>
    <van-button plain size="mini" type="primary" @click="refreshNetwork">刷新</van-button>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getBridgeClient } from '@/bridge/bridge-client';
import type { NetworkStatus } from '@/bridge/types';

const online = ref(navigator.onLine);
const networkStatus = ref<NetworkStatus | null>(null);
const errorMessage = ref('');

const label = computed(() => {
  if (errorMessage.value) {
    return errorMessage.value;
  }
  if (!networkStatus.value) {
    return online.value ? '网络可用' : '网络不可用';
  }
  return `${networkStatus.value.connected ? '网络可用' : '网络不可用'} / ${networkStatus.value.type}`;
});

/** Refreshes network state through Android Shell instead of relying only on browser navigator state. */
async function refreshNetwork(): Promise<void> {
  const result = await getBridgeClient().getNetworkStatus();
  if (result.ok) {
    networkStatus.value = result.data;
    online.value = result.data.connected;
    errorMessage.value = '';
    return;
  }
  errorMessage.value = result.error.message;
}

onMounted(() => {
  void refreshNetwork();
});
</script>
