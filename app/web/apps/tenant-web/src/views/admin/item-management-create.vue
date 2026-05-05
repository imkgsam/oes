<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

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
      <header class="item-create-header">
        <div class="item-create-title">
          <div class="item-create-icon">
            <IconifyIcon icon="lucide:package-plus" />
          </div>
          <div>
            <div class="item-create-breadcrumb">
              <span>主数据</span>
              <IconifyIcon icon="lucide:chevron-right" />
              <span>创建 Item</span>
            </div>
            <h1>创建 Item</h1>
            <p>只创建物品身份，后续能力、分类和模具方案在详情页继续完成。</p>
          </div>
        </div>
      </header>

      <section class="item-create-flow item-create-card">
        <div class="item-create-flow__line">Item → 详情 → 模具方案</div>
        <div class="item-create-flow__steps">
          <span class="item-create-flow__step item-create-flow__step--active">
            <IconifyIcon icon="lucide:badge-plus" />
            创建身份
          </span>
          <span class="item-create-flow__step">
            <IconifyIcon icon="lucide:sliders-horizontal" />
            补齐能力与分类
          </span>
          <span class="item-create-flow__step">
            <IconifyIcon icon="lucide:drafting-compass" />
            创建模具方案
          </span>
        </div>
      </section>

      <section class="item-create-card">
        <div class="item-create-section-title">
          <div>
            <h2>基础字段</h2>
            <p>创建后进入详情补齐能力、分类和模具方案。</p>
          </div>
          <span>4 字段</span>
        </div>
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
  --item-primary: #005daa;
  --item-border: #d9dee8;
  --item-muted: #69717f;
  --item-text: #181c22;
  color: var(--item-text);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-create-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.item-create-title {
  display: flex;
  gap: 14px;
}

.item-create-icon {
  align-items: center;
  background: #eef4fb;
  border: 1px solid #d6e4f5;
  border-radius: 6px;
  color: var(--item-primary);
  display: flex;
  flex: 0 0 56px;
  font-size: 28px;
  height: 56px;
  justify-content: center;
}

.item-create-breadcrumb {
  align-items: center;
  color: var(--item-muted);
  display: flex;
  font-size: 12px;
  gap: 4px;
  margin-bottom: 6px;
}

.item-create-header h1 {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  margin: 0 0 6px;
}

.item-create-header p {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
  margin: 0;
}

.item-create-card {
  background: #fff;
  border: 1px solid var(--item-border);
  border-radius: 4px;
  padding: 16px;
}

.item-create-card h1,
.item-create-card h2 {
  margin: 0 0 12px;
}

.item-create-card p,
.item-create-card ul {
  margin: 0;
}

.item-create-flow {
  display: grid;
  gap: 12px;
}

.item-create-flow__line {
  color: var(--item-primary);
  font-size: 13px;
  font-weight: 600;
}

.item-create-flow__steps {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(150px, 1fr));
}

.item-create-flow__step {
  align-items: center;
  background: #fff;
  border: 1px dashed #cbd2df;
  border-radius: 4px;
  color: var(--item-muted);
  display: flex;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
}

.item-create-flow__step--active {
  border-color: var(--item-primary);
  color: var(--item-primary);
}

.item-create-section-title {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.item-create-section-title h2 {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin: 0 0 2px;
}

.item-create-section-title p,
.item-create-section-title span {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
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
  gap: 4px;
}

.item-create-grid label span {
  color: var(--item-muted);
  font-size: 12px;
  font-weight: 600;
}

button,
input,
select {
  border: 1px solid #cbd2df;
  border-radius: 4px;
  min-height: 32px;
  padding: 5px 8px;
}

button {
  background: var(--item-primary);
  border-color: var(--item-primary);
  color: #fff;
  cursor: pointer;
  padding-left: 12px;
  padding-right: 12px;
}

@media (max-width: 760px) {
  .item-create-flow__steps {
    grid-template-columns: 1fr;
  }
}
</style>
