<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  evaluatePolicyInstancePreviewApi,
  type PolicyInstancePreviewApi,
} from '#/api';

const defaultPayload: PolicyInstancePreviewApi.EvaluatePreviewRequest = {
  mode: 'QUERY_SCOPE',
  subject: {
    accountId: '00000000-0000-4000-8000-000000000901',
    tenantId: '00000000-0000-4000-8000-000000000001',
    roleIds: [],
  },
  permissionCode: 'procurement.purchase_request.create',
  resourceType: 'item',
  policyInstances: [
    {
      id: '00000000-0000-4000-8000-000000000999',
      tenantId: '00000000-0000-4000-8000-000000000001',
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: '00000000-0000-4000-8000-000000000901',
      },
      permissionCode: 'procurement.purchase_request.create',
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'categoryId',
        allowedValues: ['00000000-0000-4000-8000-000000000996'],
      },
      enabled: true,
      priority: 100,
    },
  ],
};

const loading = ref(false);
const errorMessage = ref('');
const result = ref<null | PolicyInstancePreviewApi.EvaluatePreviewResult>(null);

const payloadText = computed(() => JSON.stringify(defaultPayload, null, 2));
const resultText = computed(() => (result.value ? JSON.stringify(result.value, null, 2) : ''));

// runPreview sends the default PolicyInstance candidate through the real Gateway preview endpoint.
async function runPreview() {
  loading.value = true;
  errorMessage.value = '';
  try {
    result.value = await evaluatePolicyInstancePreviewApi(defaultPayload);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'PolicyInstance preview failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="policy-instance-preview-page">
    <section class="policy-instance-preview__header">
      <div>
        <div class="policy-instance-preview__eyebrow">PolicyInstance</div>
        <h1>资源授权预览</h1>
      </div>
      <button
        class="policy-instance-preview__primary"
        data-testid="run-policy-instance-preview"
        type="button"
        :disabled="loading"
        @click="runPreview"
      >
        {{ loading ? '预览中' : '运行预览' }}
      </button>
    </section>

    <section class="policy-instance-preview__grid">
      <article class="policy-instance-preview__panel">
        <h2>候选实例</h2>
        <pre>{{ payloadText }}</pre>
      </article>

      <article class="policy-instance-preview__panel">
        <h2>判定结果</h2>
        <p v-if="errorMessage" class="policy-instance-preview__error">{{ errorMessage }}</p>
        <pre v-else-if="result">{{ resultText }}</pre>
        <div v-else class="policy-instance-preview__empty">等待预览</div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.policy-instance-preview-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.policy-instance-preview__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.policy-instance-preview__eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.policy-instance-preview__header h1,
.policy-instance-preview__panel h2 {
  color: #111827;
  line-height: 1.2;
  margin: 0;
}

.policy-instance-preview__header h1 {
  font-size: 24px;
}

.policy-instance-preview__panel h2 {
  font-size: 16px;
}

.policy-instance-preview__primary {
  background: #155eef;
  border: 0;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 700;
  min-height: 36px;
  padding: 0 14px;
}

.policy-instance-preview__primary:disabled {
  cursor: wait;
  opacity: 0.7;
}

.policy-instance-preview__grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.policy-instance-preview__panel {
  border: 1px solid #d6dbe5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 16px;
}

.policy-instance-preview__panel pre {
  background: #0f172a;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  max-height: 520px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.policy-instance-preview__empty,
.policy-instance-preview__error {
  color: #64748b;
  margin: 0;
}

.policy-instance-preview__error {
  color: #b42318;
}

@media (max-width: 900px) {
  .policy-instance-preview__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .policy-instance-preview__grid {
    grid-template-columns: 1fr;
  }
}
</style>
