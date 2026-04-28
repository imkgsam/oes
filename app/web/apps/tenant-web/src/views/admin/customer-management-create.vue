<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createManagedCustomerAccountApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CreateFormState {
  customerCategory: string
  displayName: string
  tagsText: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const saving = ref(false)
const form = reactive<CreateFormState>({
  customerCategory: '',
  displayName: '',
  tagsText: ''
})

/** submitCreate creates one phase 1 customer account shell and moves the operator into the dedicated detail route. */
async function submitCreate() {
  if (!activeTenantId.value) {
    return
  }

  saving.value = true
  try {
    const result = await createManagedCustomerAccountApi(activeTenantId.value, {
      displayName: form.displayName.trim(),
      customerCategory: form.customerCategory.trim() || undefined,
      tags: splitTags(form.tagsText)
    })

    if (result.customerAccountId) {
      await router.push({
        name: 'TenantCustomerManagementDetail',
        params: {
          customerAccountId: result.customerAccountId
        }
      })
    }
  } finally {
    saving.value = false
  }
}

/** splitTags normalizes the simple comma-separated tags input into the phase 1 string array payload. */
function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
</script>

<template>
  <Page>
    <section class="customer-create-page">
      <header class="customer-create-card">
        <h1>创建客户</h1>
        <p>phase 1 只收集 `displayName / customerCategory / tags`，不在这里扩张 Party truth、财务对象或多主体模型。</p>
      </header>

      <section class="customer-create-card">
        <div class="customer-create-grid">
          <label>
            <span>Display Name</span>
            <input data-testid="create-customer-display-name" v-model="form.displayName" />
          </label>
          <label>
            <span>Customer Category</span>
            <input data-testid="create-customer-category" v-model="form.customerCategory" />
          </label>
          <label>
            <span>Tags</span>
            <input data-testid="create-customer-tags" v-model="form.tagsText" placeholder="key, cn" />
          </label>
        </div>
        <button data-testid="create-customer-submit" type="button" @click="submitCreate">
          {{ saving ? '创建中...' : '创建客户' }}
        </button>
      </section>

      <section class="customer-create-card">
        <h2>Deferred</h2>
        <ul>
          <li>不在这里创建或复制 Party truth。</li>
          <li>不在这里处理多主体、多 legal entity 或 bill-to / ship-to 复杂模型。</li>
          <li>不在这里处理 AR / credit / payment 或 CustomerItemMapping。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.customer-create-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.customer-create-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.customer-create-card h1,
.customer-create-card h2 {
  margin: 0 0 12px;
}

.customer-create-card p,
.customer-create-card ul {
  margin: 0;
}

.customer-create-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.customer-create-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

button,
input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 36px;
  padding: 8px 10px;
}

button {
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}
</style>
