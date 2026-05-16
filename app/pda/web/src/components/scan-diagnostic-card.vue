<template>
  <article class="pda-card">
    <p class="pda-card__label">扫码诊断</p>
    <h2>{{ latestScan ? latestScan.payload.scanValue : '等待扫码' }}</h2>
    <p>{{ latestDescription }}</p>
    <dl v-if="latestScan" class="pda-card__facts">
      <dt>来源</dt>
      <dd>{{ latestScan.payload.scanSource }}</dd>
      <dt>适配器</dt>
      <dd>{{ latestScan.payload.scannerProvider }}</dd>
      <dt>长度</dt>
      <dd>{{ latestScan.payload.rawLength }}</dd>
      <dt>时间</dt>
      <dd>{{ latestScan.occurredAt }}</dd>
    </dl>
    <div class="pda-card__actions" @touchstart.passive="markActionStart('scan.clear')">
      <van-button plain size="small" type="primary" @click="clearScans">清空</van-button>
    </div>
    <ol v-if="scanHistory.length" class="scan-history">
      <li v-for="scan in scanHistory" :key="scan.eventId">
        <span>{{ scan.payload.scanValue }}</span>
        <small>{{ scan.payload.rawLength }} chars</small>
      </li>
    </ol>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onScanResult } from '@/bridge/bridge-client';
import { markActionPainted, markActionStart, markActionStep } from '@/diagnostics/performance-probe';
import { recordPdaDiagnosticLog } from '@/services/pda-diagnostic-log-buffer';
import type { BridgeEventEnvelope, ScanResult } from '@/bridge/types';

const scanHistory = ref<Array<BridgeEventEnvelope<ScanResult>>>([]);
const latestScan = computed(() => scanHistory.value[0] ?? null);
const latestDescription = computed(() => {
  if (!latestScan.value) {
    return '请按 PDA 扫码键。Phase 1 只显示诊断信息，不提交 MES/WMS 业务。';
  }
  return '已收到原生扫码事件。完整扫码值仅用于 Phase 1 本地诊断显示。';
});

let unsubscribe: (() => void) | undefined;

/** Subscribes to Android scanner events and keeps a short local diagnostic history. */
onMounted(() => {
  unsubscribe = onScanResult((event) => {
    scanHistory.value = [event, ...scanHistory.value].slice(0, 5);
    recordPdaDiagnosticLog({
      level: 'INFO',
      eventType: 'SCAN_RECEIVED',
      message: 'Scan result received',
      requestId: event.eventId,
      diagnosticMode: true,
      details: {
        scanValue: event.payload.scanValue,
        scanLength: event.payload.rawLength,
        scanSource: event.payload.scanSource,
        scannerProvider: event.payload.scannerProvider,
        symbology: event.payload.symbology ?? null,
      },
    });
  });
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

/** Clears local scan diagnostics without affecting business state. */
function clearScans(): void {
  markActionStep('scan.clear', 'handler-start');
  scanHistory.value = [];
  recordPdaDiagnosticLog({
    level: 'INFO',
    eventType: 'SCAN_HISTORY_CLEARED',
    message: 'Local scan diagnostic history cleared',
    diagnosticMode: true,
  });
  markActionStep('scan.clear', 'state-cleared');
  void markActionPainted('scan.clear', 'painted');
}
</script>
