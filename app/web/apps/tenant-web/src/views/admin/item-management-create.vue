<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createManagedItemApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CreateFormState {
  itemCode: string
  itemName: string
  natureType: ItemManagementApi.ItemNatureType
  structureType: ItemManagementApi.ItemStructureType
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const saving = ref(false)
const form = reactive<CreateFormState>({
  itemCode: '',
  itemName: '',
  natureType: 'PHYSICAL',
  structureType: 'SINGLE'
})

/** submitCreate creates one phase 1 item and moves the operator into the dedicated detail route. */
async function submitCreate() {
  if (!activeTenantId.value) {
    return
  }

  saving.value = true
  try {
    const result = await createManagedItemApi(activeTenantId.value, {
      itemCode: form.itemCode.trim(),
      itemName: form.itemName.trim(),
      structureType: form.structureType,
      natureType: form.natureType
    })

    if (result.itemId) {
      await router.push({
        name: 'TenantItemManagementDetail',
        params: {
          itemId: result.itemId
        }
      })
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Page>
    <section class="item-create-page">
      <header class="item-create-card">
        <h1>创建 Item</h1>
        <p>phase 1 只收集 `itemCode / itemName / structureType / natureType`，分类冻结后不在这里隐式扩张。</p>
      </header>

      <section class="item-create-card">
        <div class="item-create-grid">
          <label>
            <span>Item Code</span>
            <input data-testid="create-item-code" v-model="form.itemCode" />
          </label>
          <label>
            <span>Item Name</span>
            <input data-testid="create-item-name" v-model="form.itemName" />
          </label>
          <label>
            <span>Structure Type</span>
            <select data-testid="create-item-structure" v-model="form.structureType">
              <option value="SINGLE">SINGLE</option>
              <option value="BUNDLE">BUNDLE</option>
            </select>
          </label>
          <label>
            <span>Nature Type</span>
            <select data-testid="create-item-nature" v-model="form.natureType">
              <option value="PHYSICAL">PHYSICAL</option>
              <option value="VIRTUAL">VIRTUAL</option>
              <option value="SERVICE">SERVICE</option>
            </select>
          </label>
        </div>
        <button data-testid="create-item-submit" type="button" @click="submitCreate">
          {{ saving ? '创建中...' : '创建 Item' }}
        </button>
      </section>

      <section class="item-create-card">
        <h2>Deferred</h2>
        <ul>
          <li>不在这里处理 ItemCategory。</li>
          <li>不在这里处理 Packaging / ManufacturingSpec / StockItemType。</li>
          <li>不在这里处理 SalesConfig / PIM / PLM。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-create-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.item-create-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.item-create-card h1,
.item-create-card h2 {
  margin: 0 0 12px;
}

.item-create-card p,
.item-create-card ul {
  margin: 0;
}

.item-create-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.item-create-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

button,
input,
select {
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
