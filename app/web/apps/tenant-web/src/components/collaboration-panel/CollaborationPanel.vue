<script setup lang="ts">
import type { CollaborationObjectContext } from './types'

import { ref } from 'vue'

import { IconifyIcon } from '@vben/icons'
import { Button, Drawer } from 'ant-design-vue'

import { $t } from '#/locales'

import NotesTab from './NotesTab.vue'

defineProps<{
  objectContext: CollaborationObjectContext
}>()

const open = ref(false)
const fallbackMessages = {
  collaboration: '协作',
  notes: '备注'
} as const

/** t resolves collaboration panel locale keys while preserving Chinese fallback text. */
function t(key: keyof typeof fallbackMessages) {
  const path = `page.collaboration.annotation.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : fallbackMessages[key]
}
</script>

<template>
  <div class="collaboration-panel-entry">
    <Button
      data-testid="collaboration-panel-open"
      type="default"
      @click="open = true"
    >
      <IconifyIcon icon="ant-design:message-outlined" />
      {{ t('notes') }}
    </Button>

    <Drawer
      v-model:open="open"
      class="collaboration-panel"
      destroy-on-close
      placement="right"
      :title="objectContext.displayName || t('collaboration')"
      width="min(460px, 100vw)"
    >
      <NotesTab :object-context="objectContext" />
    </Drawer>
  </div>
</template>

<style scoped>
.collaboration-panel-entry {
  display: flex;
  min-width: 0;
}

.collaboration-panel-entry :deep(.ant-btn) {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

</style>
