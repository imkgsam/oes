<script setup lang="ts">
import type { PersonalCenterApi } from '#/api/bff/personal-center';
import type { UploadProps } from 'ant-design-vue';

import { computed, reactive, ref, watch } from 'vue';

import { Avatar, Button, Card, Form, Input, message, Tag, Upload } from 'ant-design-vue';
import { Tooltip } from 'ant-design-vue';

import { uploadAccountAvatarApi } from '#/api/bff/personal-center';

const props = withDefaults(
  defineProps<{
  accountContext: PersonalCenterApi.AccountContext;
  saving?: boolean;
}>(),
  {
    saving: false,
  },
);

const emit = defineEmits<{
  save: [payload: PersonalCenterApi.UpdateAccountProfilePayload];
}>();

const formState = reactive<PersonalCenterApi.UpdateAccountProfilePayload>({
  avatarAssetId: undefined,
  bio: undefined,
  displayName: undefined,
});
const avatarPreview = ref<string>();
const uploadingAvatar = ref(false);

const scopeLabel = computed(() => {
  return props.accountContext.scopeLevel === 'SYSTEM' ? '系统平台' : '租户账号';
});

const roleItems = computed(() => props.accountContext.roles ?? []);
const roleCount = computed(() => roleItems.value.length);
const isDirty = computed(() => {
  return Boolean(formState.avatarAssetId)
    || normalize(formState.displayName) !== normalize(props.accountContext.displayName)
    || normalize(formState.bio) !== normalize(props.accountContext.bio);
});

watch(
  () => props.accountContext,
  (accountContext) => {
    formState.avatarAssetId = undefined;
    avatarPreview.value = accountContext.avatar;
    formState.displayName = accountContext.displayName;
    formState.bio = accountContext.bio;
  },
  { immediate: true, deep: true },
);

function resetForm() {
  formState.avatarAssetId = undefined;
  avatarPreview.value = props.accountContext.avatar;
  formState.displayName = props.accountContext.displayName;
  formState.bio = props.accountContext.bio;
}

function submitForm() {
  emit('save', {
    avatarAssetId: formState.avatarAssetId,
    bio: formState.bio,
    displayName: formState.displayName,
  });
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = async (file) => {
  const rawFile = file as File;
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  if (!allowedTypes.has(rawFile.type)) {
    message.error('头像仅支持 JPG、PNG 或 WebP 格式');
    return Upload.LIST_IGNORE;
  }

  if (rawFile.size > 2 * 1024 * 1024) {
    message.error('头像大小不能超过 2MB');
    return Upload.LIST_IGNORE;
  }

  uploadingAvatar.value = true;
  try {
    const result = await uploadAccountAvatarApi(rawFile);
    formState.avatarAssetId = result.avatarAsset.assetId;
    avatarPreview.value = result.avatarAsset.publicUrl;
    message.success('头像上传成功，保存后生效');
  } finally {
    uploadingAvatar.value = false;
  }

  return false;
};

function normalize(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : '';
}
</script>

<template>
  <Card :bordered="false" class="section-card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <div class="section-title">当前账号上下文</div>
          <Tooltip title="这里是 account 级资料与工作上下文。头像、显示名、简介可编辑；角色与工作联系方式只读。">
            <span class="help-dot">?</span>
          </Tooltip>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="field-card">
        <div class="field-label">账号名称</div>
        <div class="field-value">{{ accountContext.accountName || '未命名账号' }}</div>
      </div>
      <div class="field-card">
        <div class="field-label">当前租户</div>
        <div class="field-value">
          {{ accountContext.scopeLevel === 'SYSTEM' ? '系统平台' : accountContext.tenantName || accountContext.tenantId || '未绑定租户' }}
        </div>
      </div>
      <div class="field-card">
        <div class="field-label">Scope</div>
        <div class="field-value">
          <Tag :color="accountContext.scopeLevel === 'SYSTEM' ? 'blue' : 'green'">
            {{ scopeLabel }}
          </Tag>
        </div>
      </div>
      <div class="field-card">
        <div class="field-label">账号 ID</div>
        <div class="field-value">{{ accountContext.accountId }}</div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
      <div class="subpanel">
        <div class="subpanel-title">资料编辑</div>

        <div class="mt-5 grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div class="flex flex-col items-center gap-3">
            <Avatar :size="96" :src="avatarPreview">
              {{ (accountContext.displayName || accountContext.accountName || 'A').slice(0, 1) }}
            </Avatar>
            <Upload
              :before-upload="beforeAvatarUpload"
              :disabled="saving || uploadingAvatar"
              :max-count="1"
              :show-upload-list="false"
              accept="image/jpeg,image/png,image/webp"
            >
              <Button size="small" :loading="uploadingAvatar">
                上传头像
              </Button>
            </Upload>
          </div>

          <Form layout="vertical" @finish="submitForm">
            <div class="grid gap-4 md:grid-cols-2">
              <Form.Item label="显示名">
                <Input
                  v-model:value="formState.displayName"
                  :maxlength="64"
                  placeholder="请输入当前账号显示名"
                  show-count
                />
              </Form.Item>
            </div>
            <Form.Item label="个人简介">
              <Input.TextArea
                v-model:value="formState.bio"
                :auto-size="{ minRows: 3, maxRows: 5 }"
                :maxlength="280"
                placeholder="请输入当前账号简介"
                show-count
              />
            </Form.Item>
            <div class="flex flex-wrap gap-3">
              <Button
                type="primary"
                :disabled="!isDirty || uploadingAvatar"
                :loading="saving"
                @click="submitForm"
              >
                保存当前账号资料
              </Button>
              <Button :disabled="saving || uploadingAvatar || !isDirty" @click="resetForm">重置</Button>
            </div>
          </Form>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="role-panel">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="subpanel-title">当前账号角色</div>
              <div class="mt-2 text-3xl font-semibold text-foreground">
                {{ roleCount }}
              </div>
            </div>
            <Tag color="processing" class="role-count-tag">
              {{ roleCount > 0 ? '已分配角色' : '暂无角色' }}
            </Tag>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <div
              v-for="role in roleItems"
              :key="role.roleId || role.code"
              class="role-pill"
            >
              {{ role.name || role.code }}
            </div>
            <div v-if="roleItems.length === 0" class="role-pill role-pill-muted">
              当前账号暂无角色
            </div>
          </div>
        </div>

        <div class="subpanel">
          <div class="subpanel-title">工作信息</div>
          <div class="mt-4 grid gap-4">
            <div class="field-card">
              <div class="field-label">企业工作邮箱</div>
              <div class="field-value">{{ accountContext.workEmail || '未下发' }}</div>
            </div>
            <div class="field-card">
              <div class="field-label">企业工作手机号</div>
              <div class="field-value">{{ accountContext.workPhone || '未下发' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.section-card {
  border: 1px solid hsl(var(--border));
  border-radius: 20px;
  background: hsl(var(--card));
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
}

.help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
  line-height: 1;
  cursor: help;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.field-card {
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  padding: 16px 18px;
  background: hsl(var(--muted) / 0.45);
}

.subpanel {
  border: 1px solid hsl(var(--border));
  border-radius: 18px;
  padding: 20px;
  background: hsl(var(--background));
}

.subpanel-title {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.role-panel {
  border: 1px solid hsl(var(--primary) / 0.28);
  border-radius: 18px;
  padding: 20px;
  background: hsl(var(--primary) / 0.08);
}

.role-count-tag {
  margin-inline-start: auto;
}

.role-pill {
  border: 1px solid hsl(var(--primary) / 0.24);
  border-radius: 9999px;
  padding: 8px 14px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.role-pill-muted {
  border-color: hsl(var(--border));
  color: hsl(var(--muted-foreground));
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

.field-value {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--foreground));
  word-break: break-all;
}
</style>
