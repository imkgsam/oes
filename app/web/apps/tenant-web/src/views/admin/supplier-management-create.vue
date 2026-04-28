<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createManagedSupplierApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CreateFormState {
  displayName: string
  supplierNo: string
  supplierCategory: string
  tagsText: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const saving = ref(false)
const form = reactive<CreateFormState>({
  displayName: '',
  supplierNo: '',
  supplierCategory: '',
  tagsText: ''
})

/** submitCreate creates one phase 1 supplier shell and moves the operator into the dedicated detail route. */
async function submitCreate() {
  if (!activeTenantId.value) {
    return
  }

  saving.value = true
  try {
    const result = await createManagedSupplierApi(activeTenantId.value, {
      displayName: form.displayName.trim(),
      supplierNo: form.supplierNo.trim() || undefined,
      supplierCategory: form.supplierCategory.trim() || undefined,
      tags: splitTags(form.tagsText)
    })

    if (result.supplierId) {
      await router.push({
        name: 'TenantSupplierManagementDetail',
        params: {
          supplierId: result.supplierId
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
    <section class="supplier-create-page">
      <header class="supplier-create-card">
        <h1>创建供应商</h1>
        <p>phase 1 只收集 `displayName / supplierNo / supplierCategory / tags`，不在这里扩张 Party truth、SupplierItemMapping 或采购商业条款。</p>
      </header>

      <section class="supplier-create-card">
        <div class="supplier-create-grid">
          <label>
            <span>Display Name</span>
            <input data-testid="create-supplier-display-name" v-model="form.displayName" />
          </label>
          <label>
            <span>Supplier No</span>
            <input data-testid="create-supplier-no" v-model="form.supplierNo" />
          </label>
          <label>
            <span>Supplier Category</span>
            <input data-testid="create-supplier-category" v-model="form.supplierCategory" />
          </label>
          <label>
            <span>Tags</span>
            <input data-testid="create-supplier-tags" v-model="form.tagsText" placeholder="strategic, cn" />
          </label>
        </div>
        <button data-testid="create-supplier-submit" type="button" @click="submitCreate">
          {{ saving ? '创建中...' : '创建供应商' }}
        </button>
      </section>

      <section class="supplier-create-card">
        <h2>Deferred</h2>
        <ul>
          <li>不在这里创建或复制 Party truth。</li>
          <li>不在这里处理 SupplierItemMapping。</li>
          <li>不在这里处理 RFQ、SupplierQuote、采购价格、MOQ、账期或 lead time。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.supplier-create-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.supplier-create-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.supplier-create-card h1,
.supplier-create-card h2 {
  margin: 0 0 12px;
}

.supplier-create-card p,
.supplier-create-card ul {
  margin: 0;
}

.supplier-create-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.supplier-create-grid label {
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
