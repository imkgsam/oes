<template>
  <section class="mold-workbench-view">
    <header class="mold-workbench-view__header">
      <div>
        <p class="eyebrow">MOLD EXECUTION</p>
        <h1>模具作业</h1>
      </div>
      <van-button plain size="small" type="primary" @click="router.push('/workbench')">返回</van-button>
    </header>

    <van-notice-bar v-if="feedback" :type="feedbackType" :text="feedback" wrapable />

    <van-cell-group inset title="扫码对象">
      <van-field v-model="productionMoldId" data-test-id="pda-mold-id" label="模具码" placeholder="扫描或输入 productionMoldId" />
      <van-field v-model="toolingInstallationId" data-test-id="pda-tooling-installation-id" label="安装码" placeholder="拆除 / Ready / 注浆需要" />
      <van-field v-model="storageResourceId" data-test-id="pda-storage-resource-id" label="库位码" placeholder="移动到库位时扫描" />
      <van-field v-model="workCenterId" data-test-id="pda-work-center-id" label="产线码" placeholder="安装或注浆时扫描" />
      <van-field
        v-model.number="moldPositionIndex"
        data-test-id="pda-mold-position-index"
        label="产线位置"
        placeholder="默认最后，特殊安装填数字"
        type="number"
      />
      <van-field v-model="usageQuantity" data-test-id="pda-usage-quantity" label="注浆数" placeholder="READY 后录入" type="number" />
    </van-cell-group>

    <div class="mold-workbench-view__actions">
      <van-button block data-test-id="pda-confirm-arrival" :loading="submitting === 'arrival'" type="primary" @click="confirmArrival">
        到场确认
      </van-button>
      <van-button block data-test-id="pda-move-mold" :loading="submitting === 'move'" plain type="primary" @click="moveMold">
        移动到库位
      </van-button>
      <van-button block data-test-id="pda-install-mold" :loading="submitting === 'install'" plain type="primary" @click="installMold">
        安装到产线
      </van-button>
      <van-button block data-test-id="pda-confirm-ready" :loading="submitting === 'ready'" type="success" @click="confirmReady">
        确认可注浆
      </van-button>
      <van-button
        block
        data-test-id="pda-record-usage"
        :disabled="!canRecordUsage"
        :loading="submitting === 'usage'"
        type="success"
        @click="recordUsage"
      >
        录入注浆
      </van-button>
      <van-button block data-test-id="pda-mark-scrap" :loading="submitting === 'scrap'" plain type="danger" @click="markScrap">
        标记报废
      </van-button>
      <van-button block data-test-id="pda-unmount-mold" :loading="submitting === 'unmount'" type="danger" @click="unmountMold">
        确认拆除
      </van-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  confirmPdaInstalledMoldReady,
  confirmPdaProductionMoldArrival,
  installPdaProductionMold,
  markPdaProductionMoldForScrap,
  movePdaProductionMold,
  recordPdaMoldUsageBatch,
  unmountPdaProductionMold,
} from '@/api/pda-bff.client';
import { useSessionStore } from '@/stores/session.store';

const router = useRouter();
const sessionStore = useSessionStore();
const productionMoldId = ref('');
const toolingInstallationId = ref('');
const storageResourceId = ref('');
const workCenterId = ref('');
const moldPositionIndex = ref<number | undefined>(undefined);
const usageQuantity = ref('');
const readyConfirmed = ref(false);
const submitting = ref('');
const feedback = ref('');
const feedbackType = ref<'danger' | 'primary' | 'success' | 'warning'>('primary');
const accessToken = computed(() => sessionStore.accessToken ?? '');
const tenantId = computed(() => sessionStore.bootstrap?.account?.tenantId ?? sessionStore.bootstrap?.device?.tenantId ?? '');
const canRecordUsage = computed(
  () => readyConfirmed.value && Boolean(productionMoldId.value && toolingInstallationId.value && workCenterId.value && usageQuantity.value),
);

/** confirmArrival records that the pre-registered mold has reached the factory floor. */
async function confirmArrival(): Promise<void> {
  await runCommand('arrival', '到场确认完成', async () => {
    await confirmPdaProductionMoldArrival(requireAccessToken(), requireTenantId(), requireProductionMoldId());
  });
}

/** moveMold records a scanned mold movement to a scanned storage resource. */
async function moveMold(): Promise<void> {
  await runCommand('move', '移动完成', async () => {
    await movePdaProductionMold(requireAccessToken(), requireTenantId(), requireProductionMoldId(), {
      storageResourceId: requireValue(storageResourceId.value, '请扫描库位码'),
    });
  });
}

/** installMold records line installation using a numeric position index. */
async function installMold(): Promise<void> {
  await runCommand('install', '安装完成，待确认可注浆', async () => {
    await installPdaProductionMold(requireAccessToken(), requireTenantId(), requireProductionMoldId(), {
      workCenterRef: {
        workCenterId: requireWorkCenterId(),
      },
      moldPositionIndex: moldPositionIndex.value,
    });
    readyConfirmed.value = false;
  });
}

/** confirmReady transitions the installed mold from maintenance to ready. */
async function confirmReady(): Promise<void> {
  await runCommand('ready', '已确认可注浆', async () => {
    await confirmPdaInstalledMoldReady(
      requireAccessToken(),
      requireTenantId(),
      requireProductionMoldId(),
      requireToolingInstallationId(),
    );
    readyConfirmed.value = true;
  });
}

/** recordUsage sends one submitted casting usage row for the current WorkCenter. */
async function recordUsage(): Promise<void> {
  await runCommand('usage', '注浆记录已提交', async () => {
    await recordPdaMoldUsageBatch(
      requireAccessToken(),
      requireTenantId(),
      { workCenterId: requireWorkCenterId() },
      [
        {
          checked: true,
          productionMoldId: requireProductionMoldId(),
          toolingInstallationId: requireToolingInstallationId(),
          usageQuantity: requireValue(usageQuantity.value, '请填写注浆数'),
        },
      ],
    );
  });
}

/** markScrap records a scanned mold as scrap pending or scrapped according to MES state. */
async function markScrap(): Promise<void> {
  await runCommand('scrap', '报废标记已提交', async () => {
    await markPdaProductionMoldForScrap(requireAccessToken(), requireTenantId(), requireProductionMoldId());
  });
}

/** unmountMold confirms physical removal and lets MES close the active installation. */
async function unmountMold(): Promise<void> {
  await runCommand('unmount', '拆除已确认', async () => {
    await unmountPdaProductionMold(requireAccessToken(), requireTenantId(), requireToolingInstallationId());
    readyConfirmed.value = false;
  });
}

/** runCommand serializes one PDA operation and turns failures into operator feedback. */
async function runCommand(command: string, successMessage: string, work: () => Promise<void>): Promise<void> {
  if (submitting.value) {
    return;
  }

  submitting.value = command;
  feedback.value = '';
  feedbackType.value = 'primary';
  try {
    await work();
    feedback.value = successMessage;
    feedbackType.value = 'success';
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : '模具作业失败，请重试。';
    feedbackType.value = 'danger';
  } finally {
    submitting.value = '';
  }
}

function requireAccessToken(): string {
  return requireValue(accessToken.value, '请先登录 PDA');
}

function requireTenantId(): string {
  return requireValue(tenantId.value, '当前会话缺少租户信息');
}

function requireProductionMoldId(): string {
  return requireValue(productionMoldId.value, '请扫描模具码');
}

function requireToolingInstallationId(): string {
  return requireValue(toolingInstallationId.value, '请扫描安装码');
}

function requireWorkCenterId(): string {
  return requireValue(workCenterId.value, '请扫描产线码');
}

function requireValue(value: string, message: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}
</script>

<style scoped>
.mold-workbench-view {
  min-height: 100vh;
  padding: 16px;
  background: #f5f7fb;
}

.mold-workbench-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.mold-workbench-view__header h1 {
  margin: 0;
  font-size: 24px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0;
}

.mold-workbench-view__actions {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}
</style>
