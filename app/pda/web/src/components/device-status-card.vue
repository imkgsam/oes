<template>
  <article class="pda-card">
    <p class="pda-card__label">设备</p>
    <h2>{{ title }}</h2>
    <p>{{ subtitle }}</p>
    <dl v-if="details.length" class="pda-card__facts">
      <template v-for="item in details" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </template>
    </dl>
    <div class="pda-card__actions">
      <van-button size="small" type="primary" @click="loadDevice">读取设备信息</van-button>
      <van-button plain size="small" type="primary" @click="playBeep">蜂鸣</van-button>
      <van-button plain size="small" type="primary" @click="runVibration">震动</van-button>
    </div>
    <p class="pda-card__hint">{{ feedbackMessage }}</p>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getBridgeClient } from '@/bridge/bridge-client';
import type { DeviceInfo } from '@/bridge/types';

const title = ref('未读取');
const subtitle = ref('等待 Android Shell 返回设备标识');
const details = ref<Array<{ label: string; value: string }>>([]);
const feedbackMessage = ref('蜂鸣/震动用于验证 Android 原生反馈能力');

/** Loads device identity through the stable PDA JS Bridge contract. */
async function loadDevice(): Promise<void> {
  const result = await getBridgeClient().getDeviceInfo();
  if (result.ok) {
    applyDeviceInfo(result.data);
    return;
  }
  title.value = '读取失败';
  subtitle.value = result.error.message;
}

/** Plays a short native beep through the Android Shell. */
async function playBeep(): Promise<void> {
  const result = await getBridgeClient().beep();
  feedbackMessage.value = result.ok ? '蜂鸣已触发' : result.error.message;
}

/** Triggers a short vibration through the Android Shell. */
async function runVibration(): Promise<void> {
  const result = await getBridgeClient().vibrate(180);
  feedbackMessage.value = result.ok ? '震动已触发' : result.error.message;
}

/** Copies native device info into display-friendly PDA diagnostics. */
function applyDeviceInfo(deviceInfo: DeviceInfo): void {
  title.value = deviceInfo.model;
  subtitle.value = `${deviceInfo.deviceId} / ${deviceInfo.idSource}`;
  details.value = [
    { label: '厂商', value: deviceInfo.manufacturer || '-' },
    { label: 'Android', value: deviceInfo.osVersion || '-' },
    { label: 'SDK', value: String(deviceInfo.sdkInt ?? '-') },
    { label: 'WebView', value: deviceInfo.webViewVersion || '-' },
    { label: 'App', value: deviceInfo.appVersion || '-' },
  ];
}

onMounted(() => {
  void loadDevice();
});
</script>
