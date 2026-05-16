<template>
  <article class="pda-card">
    <p class="pda-card__label">日志</p>
    <h2>本地诊断</h2>
    <p>{{ statusMessage }}</p>
    <dl class="pda-card__facts">
      <dt>待上传</dt>
      <dd>{{ logs.length }} 条</dd>
      <dt>最近事件</dt>
      <dd>{{ latestLog ? latestLog.eventType : '暂无' }}</dd>
    </dl>
    <div class="pda-card__actions">
      <van-button plain size="small" type="primary" :disabled="!logs.length || uploading" @click="clearLogs">
        清空日志
      </van-button>
      <van-button size="small" type="primary" :disabled="!logs.length" :loading="uploading" @click="uploadLogs">
        手动上传
      </van-button>
    </div>
    <ol v-if="logs.length" class="scan-history">
      <li v-for="log in logs.slice(0, 5)" :key="`${log.clientTime}:${log.eventType}`">
        <span>{{ log.eventType }}</span>
        <small>{{ log.level }} · {{ log.clientTime }}</small>
      </li>
    </ol>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  clearPdaDiagnosticLogs,
  getPdaDiagnosticLogs,
  subscribePdaDiagnosticLogs,
  uploadPdaDiagnosticLogs,
} from '@/services/pda-diagnostic-log-buffer';
import type { PdaDiagnosticLogEntry } from '@/api/pda-bff.client';

const logs = ref<PdaDiagnosticLogEntry[]>(getPdaDiagnosticLogs());
const uploading = ref(false);
const uploadMessage = ref('设备日志默认留在本机，管理员触发时才手动上传诊断包。');
const latestLog = computed(() => logs.value[0] ?? null);
const statusMessage = computed(() => uploadMessage.value);

const unsubscribe = subscribePdaDiagnosticLogs((nextLogs) => {
  logs.value = nextLogs;
});

/** Uploads local diagnostic logs only when the operator explicitly requests it. */
async function uploadLogs(): Promise<void> {
  uploading.value = true;
  uploadMessage.value = '正在上传本机诊断日志...';

  try {
    const result = await uploadPdaDiagnosticLogs();
    uploadMessage.value = result.uploadedCount && result.serverTime
      ? `后端已确认接收 ${result.uploadedCount} 条，时间 ${result.serverTime}。`
      : result.uploadedCount
        ? `后端已确认接收 ${result.uploadedCount} 条诊断日志。`
      : '当前没有可上传的诊断日志。';
  } catch (error) {
    const message = error instanceof Error ? error.message : '诊断日志上传失败。';
    uploadMessage.value = `上传失败，日志已保留，可稍后重试。${message}`;
  } finally {
    uploading.value = false;
  }
}

/** Clears local diagnostic logs without touching server-side session or business state. */
function clearLogs(): void {
  clearPdaDiagnosticLogs();
  uploadMessage.value = '本地诊断日志已清空。';
}

onBeforeUnmount(() => {
  unsubscribe();
});
</script>
