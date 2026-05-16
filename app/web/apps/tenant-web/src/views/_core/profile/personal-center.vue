<script setup lang="ts">
import type { PersonalCenterApi } from '#/api/bff/personal-center';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { Button, Result, Skeleton, Tag, Tooltip, message } from 'ant-design-vue';

import { getPersonalCenterApi, updateAccountProfileApi } from '#/api';
import { useAuthContextStore } from '#/store/auth-context';
import { resolveTestUserAvatar } from '#/store/test-user-avatar';

import PersonalAccountSection from './components/personal-account-section.vue';
import PersonalSecuritySection from './components/personal-security-section.vue';
import PersonalUserSection from './components/personal-user-section.vue';

const userStore = useUserStore();
const authContextStore = useAuthContextStore();

const loading = ref(true);
const accountSaving = ref(false);
const loadError = ref('');
const summary = ref<null | PersonalCenterApi.Summary>(null);

const pageTitle = computed(() => {
  return (
    summary.value?.accountContext.displayName ||
    summary.value?.accountContext.accountName ||
    userStore.userInfo?.realName ||
    '个人中心'
  );
});

const pageDescription = computed(() => {
  const accountName =
    summary.value?.accountContext.accountName || authContextStore.accountName;
  const tenantName =
    summary.value?.accountContext.scopeLevel === 'SYSTEM'
      ? '系统平台'
      : summary.value?.accountContext.tenantName || authContextStore.tenantName;

  return [accountName, tenantName].filter(Boolean).join(' · ');
});

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

async function loadSummary(options?: { silent?: boolean }) {
  if (!options?.silent) {
    loading.value = true;
  }
  loadError.value = '';

  try {
    summary.value = await getPersonalCenterApi();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '加载个人中心失败';
    summary.value = null;
  } finally {
    if (options?.silent) {
      return;
    }

    loading.value = false;
  }
}

async function handleAccountProfileSave(payload: PersonalCenterApi.UpdateAccountProfilePayload) {
  accountSaving.value = true;

  try {
    const result = await updateAccountProfileApi(payload);

    if (summary.value) {
      summary.value = {
        ...summary.value,
        accountContext: {
          ...summary.value.accountContext,
          ...result.accountContext,
        },
      };
    }

    if (authContextStore.sessionContext) {
      authContextStore.sessionContext = {
        ...authContextStore.sessionContext,
        account: {
          ...authContextStore.sessionContext.account,
          avatar: result.accountContext.avatar,
          name:
            result.accountContext.displayName ||
            result.accountContext.accountName ||
            authContextStore.sessionContext.account.name,
        },
        operator: {
          ...authContextStore.sessionContext.operator,
          displayName:
            result.accountContext.displayName ||
            authContextStore.sessionContext.operator.displayName,
        },
      };
    }

    if (userStore.userInfo) {
      const fallbackAvatar = resolveTestUserAvatar(
        preferences.app.defaultAvatar,
        authContextStore.sessionContext?.operator?.userId,
      );

      userStore.setUserInfo({
        ...userStore.userInfo,
        avatar: result.accountContext.avatar || fallbackAvatar,
        realName:
          result.accountContext.displayName ||
          result.accountContext.accountName ||
          userStore.userInfo.realName,
      });
    }

    message.success('账号资料已更新');
    await loadSummary({ silent: true });
  } catch (error) {
    message.error(getErrorMessage(error, '更新账号资料失败，请稍后重试'));
  } finally {
    accountSaving.value = false;
  }
}

onMounted(() => {
  void loadSummary();
});
</script>

<template>
  <Page auto-content-height>
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 p-1">
      <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div class="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Personal Center
            </div>
            <div class="mt-3 flex items-center gap-2">
              <h1 class="text-3xl font-semibold text-foreground">
                {{ pageTitle }}
              </h1>
              <Tooltip title="查看当前登录人的身份信息、当前账号上下文，以及可直接进入的安全入口。">
                <span class="help-dot">?</span>
              </Tooltip>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <Tag color="blue">{{ authContextStore.scopeLabel }}</Tag>
              <Tag v-if="pageDescription" color="default">{{ pageDescription }}</Tag>
            </div>
          </div>
          <Tooltip title="头像、显示名、个人简介可编辑；登录方式、工作联系方式、角色和安全能力在各自分区查看。">
            <span class="help-dot">?</span>
          </Tooltip>
        </div>
      </div>

      <Result
        v-if="!loading && loadError"
        status="error"
        title="个人中心加载失败"
        :sub-title="loadError"
      >
        <template #extra>
          <Button type="primary" @click="() => loadSummary()">重新加载</Button>
        </template>
      </Result>

      <div v-else class="flex flex-col gap-5">
        <Skeleton
          v-if="loading"
          active
          :paragraph="{ rows: 12 }"
          :title="{ width: '40%' }"
        />

        <template v-else-if="summary">
          <PersonalUserSection :user-profile="summary.userProfile" />
          <PersonalAccountSection
            :account-context="summary.accountContext"
            :allowed-terminals="authContextStore.sessionContext?.allowedTerminals ?? []"
            :saving="accountSaving"
            @save="handleAccountProfileSave"
          />
          <PersonalSecuritySection :entries="summary.securityEntries" />
        </template>
      </div>
    </div>
  </Page>
</template>

<style scoped>
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
</style>
