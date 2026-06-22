<script setup lang="ts">
import type { CollaborationAnnotationApi } from '#/api'
import type { CollaborationObjectContext } from './types'

import { computed, onMounted, reactive, ref } from 'vue'

import { IconifyIcon } from '@vben/icons'
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  Modal,
  Select,
  SelectOption,
  Skeleton,
  Tag
} from 'ant-design-vue'

import {
  createCollaborationAnnotationApi,
  deleteCollaborationAnnotationApi,
  listCollaborationAnnotationsApi,
  setCollaborationAnnotationPinnedApi,
  updateCollaborationAnnotationApi
} from '#/api'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

const props = defineProps<{
  objectContext: CollaborationObjectContext
}>()

const fallbackMessages = {
  archivedReadonly: '已归档对象仅支持查看备注。',
  cancel: '取消',
  delete: '删除',
  deleteConfirm: '删除这条备注？',
  edit: '编辑',
  edited: '已编辑',
  loadFailed: '备注加载失败。',
  moreActions: '更多操作',
  noCreatePermission: '你可以查看备注，但没有新建备注权限。',
  noNotes: '暂无备注',
  objectVisible: '公开',
  pinned: '已置顶',
  private: '私人',
  privateVisibility: '私人',
  save: '保存',
  pin: '置顶',
  unpin: '取消置顶',
  unknownAuthor: '未知成员',
  writePlaceholder: '写一条内部备注'
} as const

const authContextStore = useAuthContextStore()
const notes = ref<CollaborationAnnotationApi.AnnotationView[]>([])
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const editingAnnotationId = ref('')
const draft = reactive({
  bodyText: '',
  visibility: 'OBJECT_VISIBLE' as CollaborationAnnotationApi.AnnotationVisibility
})
const editDraft = reactive({
  bodyText: '',
  visibility: 'OBJECT_VISIBLE' as CollaborationAnnotationApi.AnnotationVisibility
})

const canCreate = computed(() =>
  authContextStore.actionCodes.includes('collaboration.annotation.create')
)
const canManage = computed(() =>
  authContextStore.actionCodes.includes('collaboration.annotation.manage')
)
const currentAccountId = computed(() => resolveCurrentAccountId(authContextStore.sessionContext))
const currentOperatorDisplayName = computed(() => resolveCurrentOperatorDisplayName(authContextStore.sessionContext))
const readonlyReason = computed(() => props.objectContext.archived ? t('archivedReadonly') : '')
const creationDisabled = computed(() => Boolean(readonlyReason.value) || !canCreate.value)

/** loadNotes refreshes visible object notes through the Annotation BFF. */
async function loadNotes() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listCollaborationAnnotationsApi(props.objectContext.objectRef, {
      includePrivate: true,
      page: 1,
      pageSize: 50
    })
    notes.value = result.items ?? []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('loadFailed')
    notes.value = []
  } finally {
    loading.value = false
  }
}

/** submitNote creates one object note when the editor is enabled and non-empty. */
async function submitNote() {
  const bodyText = draft.bodyText.trim()
  if (!bodyText || creationDisabled.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await createCollaborationAnnotationApi(props.objectContext.objectRef, {
      bodyText,
      visibility: draft.visibility
    })
    draft.bodyText = ''
    draft.visibility = 'OBJECT_VISIBLE'
    await loadNotes()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('loadFailed')
  } finally {
    submitting.value = false
  }
}

/** startEdit prepares an author-owned note for inline editing. */
function startEdit(note: CollaborationAnnotationApi.AnnotationView) {
  editingAnnotationId.value = note.annotationId
  editDraft.bodyText = note.bodyText
  editDraft.visibility = note.visibility === 'PRIVATE' ? 'PRIVATE' : 'OBJECT_VISIBLE'
}

/** cancelEdit exits inline editing without mutating the note. */
function cancelEdit() {
  editingAnnotationId.value = ''
  editDraft.bodyText = ''
  editDraft.visibility = 'OBJECT_VISIBLE'
}

/** saveEdit sends author-owned note edits through the BFF and reloads the list. */
async function saveEdit(note: CollaborationAnnotationApi.AnnotationView) {
  const bodyText = editDraft.bodyText.trim()
  if (!bodyText || props.objectContext.archived) return
  await updateCollaborationAnnotationApi(note.annotationId, {
    bodyText,
    visibility: editDraft.visibility
  })
  cancelEdit()
  await loadNotes()
}

/** deleteNote soft-deletes a note and lets the backend enforce author/manage rules. */
async function deleteNote(note: CollaborationAnnotationApi.AnnotationView) {
  await deleteCollaborationAnnotationApi(note.annotationId)
  await loadNotes()
}

/** confirmDeleteNote asks before soft-deleting one note from the operations menu. */
function confirmDeleteNote(note: CollaborationAnnotationApi.AnnotationView) {
  Modal.confirm({
    content: t('deleteConfirm'),
    okButtonProps: { danger: true },
    okText: t('deleteConfirm'),
    title: t('deleteConfirm'),
    onOk: () => deleteNote(note)
  })
}

/** togglePinned changes manager-governed object pin state for active owner objects. */
async function togglePinned(note: CollaborationAnnotationApi.AnnotationView) {
  if (props.objectContext.archived || !canManage.value) return
  await setCollaborationAnnotationPinnedApi(note.annotationId, !note.pinned)
  await loadNotes()
}

/** canEditNote returns whether the current operator can edit note content under P1 author rules. */
function canEditNote(note: CollaborationAnnotationApi.AnnotationView) {
  return !props.objectContext.archived && note.authorAccountId === currentAccountId.value
}

/** canDeleteNote returns whether the current operator can soft-delete the note from the ordinary UI. */
function canDeleteNote(note: CollaborationAnnotationApi.AnnotationView) {
  return note.authorAccountId === currentAccountId.value || canManage.value
}

/** hasNoteActions returns whether the compact operations menu should be visible. */
function hasNoteActions(note: CollaborationAnnotationApi.AnnotationView) {
  return canManage.value || canEditNote(note) || canDeleteNote(note)
}

/** noteAuthorName renders a safe author label without exposing raw account ids. */
function noteAuthorName(note: CollaborationAnnotationApi.AnnotationView) {
  const displayName = note.authorDisplayNameSnapshot?.trim() ?? ''
  if (displayName && !isIdLikeDisplayName(displayName)) {
    return displayName
  }
  if (note.authorAccountId === currentAccountId.value && currentOperatorDisplayName.value) {
    return currentOperatorDisplayName.value
  }
  return t('unknownAuthor')
}

/** isIdLikeDisplayName detects technical ids that should not be rendered as human names. */
function isIdLikeDisplayName(value: string) {
  return /^[\da-f]{8,}-[\da-f-]{12,}$/i.test(value) || value === value.toLowerCase() && value.length > 24 && /^[\da-f-]+$/i.test(value)
}

/** noteTime formats ISO timestamps for compact enterprise list display. */
function noteTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

/** resolveCurrentAccountId extracts the authenticated tenant account id from known auth context shapes. */
function resolveCurrentAccountId(sessionContext: unknown): string {
  const context = (sessionContext ?? {}) as Record<string, any>
  return (
    context.account?.accountId ||
    context.account?.id ||
    context.operator?.accountId ||
    context.operator?.operatorId ||
    context.operator?.id ||
    ''
  )
}

/** resolveCurrentOperatorDisplayName extracts the current user's readable name for legacy note snapshots. */
function resolveCurrentOperatorDisplayName(sessionContext: unknown): string {
  const context = (sessionContext ?? {}) as Record<string, any>
  return (
    context.operator?.displayName ||
    context.account?.name ||
    context.operator?.name ||
    ''
  ).trim()
}

/** t resolves collaboration annotation locale keys while keeping Chinese as the local fallback. */
function t(key: keyof typeof fallbackMessages) {
  const path = `page.collaboration.annotation.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : fallbackMessages[key]
}

onMounted(() => {
  void loadNotes()
})
</script>

<template>
  <div class="notes-tab">
    <Alert
      v-if="readonlyReason"
      class="notes-tab__notice"
      data-testid="collaboration-notes-readonly"
      :message="readonlyReason"
      show-icon
      type="info"
    />
    <Alert
      v-else-if="!canCreate"
      class="notes-tab__notice"
      data-testid="collaboration-notes-permission-denied"
      :message="t('noCreatePermission')"
      show-icon
      type="warning"
    />
    <Alert
      v-if="errorMessage"
      class="notes-tab__notice"
      data-testid="collaboration-notes-error"
      :message="errorMessage"
      show-icon
      type="error"
    />

    <section
      class="notes-tab__viewport"
      data-testid="collaboration-notes-viewport"
    >
      <Skeleton v-if="loading" active :paragraph="{ rows: 5 }" />
      <Empty
        v-else-if="!notes.length"
        class="notes-tab__empty"
        data-testid="collaboration-notes-empty"
        :description="t('noNotes')"
      />

      <section v-else class="notes-tab__list">
        <article
          v-for="note in notes"
          :key="note.annotationId"
          class="notes-tab__item"
          :data-testid="`collaboration-note-${note.annotationId}`"
        >
          <header class="notes-tab__item-header">
            <div class="notes-tab__identity">
              <div class="notes-tab__avatar" aria-hidden="true">
                {{ noteAuthorName(note).slice(0, 1) }}
              </div>
              <div class="notes-tab__author">
                <strong>{{ noteAuthorName(note) }}</strong>
                <span>{{ noteTime(note.createdAt) }}</span>
              </div>
            </div>
            <div class="notes-tab__item-tools">
              <div class="notes-tab__badges">
                <Tag v-if="note.pinned" color="blue">{{ t('pinned') }}</Tag>
                <Tag v-if="note.visibility === 'PRIVATE'">{{ t('private') }}</Tag>
                <Tag v-if="note.edited">{{ t('edited') }}</Tag>
              </div>
              <Dropdown v-if="hasNoteActions(note)" :trigger="['click']">
                <Button
                  class="notes-tab__more"
                  data-testid="collaboration-note-actions-menu"
                  size="small"
                  type="text"
                  :aria-label="t('moreActions')"
                >
                  <IconifyIcon icon="ant-design:more-outlined" />
                </Button>
                <template #overlay>
                  <Menu>
                    <Menu.Item
                      v-if="canManage"
                      key="pin"
                      data-testid="collaboration-note-menu-pin"
                      :disabled="props.objectContext.archived"
                      @click="togglePinned(note)"
                    >
                      {{ note.pinned ? t('unpin') : t('pin') }}
                    </Menu.Item>
                    <Menu.Item
                      v-if="canEditNote(note)"
                      key="edit"
                      data-testid="collaboration-note-menu-edit"
                      @click="startEdit(note)"
                    >
                      {{ t('edit') }}
                    </Menu.Item>
                    <Menu.Item
                      v-if="canDeleteNote(note)"
                      key="delete"
                      danger
                      data-testid="collaboration-note-menu-delete"
                      @click="confirmDeleteNote(note)"
                    >
                      {{ t('delete') }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </div>
          </header>

          <div v-if="editingAnnotationId === note.annotationId" class="notes-tab__editor">
            <Input.TextArea
              v-model:value="editDraft.bodyText"
              data-testid="collaboration-note-edit-body"
              :auto-size="{ minRows: 3, maxRows: 7 }"
              :maxlength="4000"
              show-count
            />
            <div class="notes-tab__composer-actions">
              <Select v-model:value="editDraft.visibility" class="notes-tab__visibility">
                <SelectOption value="OBJECT_VISIBLE">{{ t('objectVisible') }}</SelectOption>
                <SelectOption value="PRIVATE">{{ t('privateVisibility') }}</SelectOption>
              </Select>
              <Button @click="cancelEdit">{{ t('cancel') }}</Button>
              <Button
                data-testid="collaboration-note-edit-save"
                :disabled="!editDraft.bodyText.trim()"
                type="primary"
                @click="saveEdit(note)"
              >
                {{ t('save') }}
              </Button>
            </div>
          </div>

          <p v-else class="notes-tab__body">{{ note.bodyText }}</p>
        </article>
      </section>
    </section>

    <section
      class="notes-tab__composer"
      data-testid="collaboration-notes-composer"
      :aria-disabled="creationDisabled"
    >
      <Input.TextArea
        v-model:value="draft.bodyText"
        data-testid="collaboration-note-body"
        :auto-size="{ minRows: 3, maxRows: 7 }"
        :disabled="creationDisabled"
        :maxlength="4000"
        :placeholder="t('writePlaceholder')"
        show-count
      />
      <div class="notes-tab__composer-actions">
        <Select
          v-model:value="draft.visibility"
          class="notes-tab__visibility"
          data-testid="collaboration-note-visibility"
          :disabled="creationDisabled"
        >
          <SelectOption value="OBJECT_VISIBLE">{{ t('objectVisible') }}</SelectOption>
          <SelectOption value="PRIVATE">{{ t('privateVisibility') }}</SelectOption>
        </Select>
        <Button
          data-testid="collaboration-note-submit"
          :disabled="creationDisabled || !draft.bodyText.trim()"
          :loading="submitting"
          type="primary"
          @click="submitNote"
        >
          {{ t('save') }}
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.notes-tab {
  --notes-border: hsl(var(--border));
  --notes-muted: hsl(var(--muted-foreground));
  --notes-panel: hsl(var(--muted) / 0.34);
  --notes-surface: hsl(var(--card));
  --notes-text: hsl(var(--foreground) / 0.92);
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  max-height: calc(100dvh - 112px);
  min-height: 100%;
  min-width: 0;
}

.notes-tab__notice {
  max-width: 100%;
}

.notes-tab__viewport {
  align-content: start;
  display: grid;
  flex: 1 1 auto;
  gap: 10px;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.notes-tab__composer,
.notes-tab__editor {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.notes-tab__composer {
  border: 1px solid var(--notes-border);
  border-radius: 8px;
  background:
    linear-gradient(180deg, hsl(var(--card) / 0.96), hsl(var(--card))),
    var(--notes-surface);
  box-shadow: 0 -10px 22px rgb(15 23 42 / 0.06);
  padding: 12px;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.notes-tab__composer-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
}

.notes-tab__visibility {
  min-width: 154px;
}

.notes-tab__empty {
  border: 1px dashed var(--notes-border);
  border-radius: 8px;
  padding: 28px 12px;
}

.notes-tab__list {
  align-content: start;
  display: grid;
  gap: 10px;
  min-width: 0;
}

.notes-tab__item {
  align-self: start;
  border: 1px solid var(--notes-border);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
}

.notes-tab__item-header {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  min-width: 0;
}

.notes-tab__identity {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.notes-tab__avatar {
  align-items: center;
  border-radius: 50%;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  display: inline-flex;
  flex: 0 0 28px;
  font-size: 13px;
  font-weight: 700;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.notes-tab__author {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.notes-tab__author strong,
.notes-tab__body {
  color: var(--notes-text);
  overflow-wrap: anywhere;
}

.notes-tab__author strong {
  font-size: 14px;
  line-height: 20px;
}

.notes-tab__author span {
  color: var(--notes-muted);
  font-size: 12px;
  line-height: 18px;
}

.notes-tab__item-tools {
  align-items: flex-start;
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  justify-content: flex-end;
  min-width: 0;
}

.notes-tab__badges {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}

.notes-tab__body {
  margin: 0;
  padding-left: 38px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.notes-tab__more {
  color: var(--notes-muted);
  height: 26px;
  width: 26px;
}

@media (max-width: 520px) {
  .notes-tab__composer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .notes-tab__item-header {
    gap: 8px;
  }

  .notes-tab__badges {
    max-width: 160px;
  }

  .notes-tab__visibility {
    width: 100%;
  }

  .notes-tab__composer-actions :deep(.ant-btn) {
    width: 100%;
  }
}
</style>
