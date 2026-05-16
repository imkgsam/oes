<template>
  <article class="pda-card">
    <p class="pda-card__label">拍照</p>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <dl v-if="photo" class="pda-card__facts">
      <dt>文件</dt>
      <dd>{{ photo.fileName }}</dd>
      <dt>类型</dt>
      <dd>{{ photo.mimeType }}</dd>
      <dt>大小</dt>
      <dd>{{ photo.sizeBytes }} bytes</dd>
      <dt>尺寸</dt>
      <dd>{{ photo.width || '-' }} x {{ photo.height || '-' }}</dd>
    </dl>
    <img v-if="photo" class="camera-preview" :src="photo.localUri" alt="PDA 拍照预览" />
    <div class="pda-card__actions">
      <van-button :loading="capturing" size="small" type="primary" @click="capturePhoto">拍照预检</van-button>
    </div>
    <p class="pda-card__hint">Phase 1 只验证本地拍照与预览，不上传业务图片。</p>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getBridgeClient } from '@/bridge/bridge-client';
import { recordPdaDiagnosticLog } from '@/services/pda-diagnostic-log-buffer';
import type { CameraCaptureResult } from '@/bridge/types';

const title = ref('相机预检');
const message = ref('等待调用 Android 系统相机。');
const photo = ref<CameraCaptureResult | null>(null);
const capturing = ref(false);

/** Opens native camera through the PDA bridge and displays returned local metadata. */
async function capturePhoto(): Promise<void> {
  capturing.value = true;
  message.value = '正在等待系统相机返回照片...';
  const result = await getBridgeClient().openCamera({ maxCount: 1, quality: 'COMPRESSED' });
  capturing.value = false;

  if (!result.ok) {
    title.value = '拍照失败';
    message.value = result.error.message;
    recordPdaDiagnosticLog({
      level: 'ERROR',
      eventType: 'CAMERA_CAPTURE_FAILED',
      message: result.error.message,
      errorCode: result.error.code,
      diagnosticMode: true,
    });
    return;
  }

  photo.value = result.data;
  title.value = '已获取照片';
  message.value = '照片已返回本机预览，仅用于 Phase 1 相机能力诊断。';
  recordPdaDiagnosticLog({
    level: 'INFO',
    eventType: 'CAMERA_CAPTURE_COMPLETED',
    message: 'Camera capture completed',
    diagnosticMode: true,
    details: {
      fileName: result.data.fileName,
      mimeType: result.data.mimeType,
      sizeBytes: result.data.sizeBytes,
      width: result.data.width ?? null,
      height: result.data.height ?? null,
    },
  });
}
</script>
