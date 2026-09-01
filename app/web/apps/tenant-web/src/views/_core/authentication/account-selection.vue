<script lang="ts" setup>
import { computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import { Tag } from 'ant-design-vue';

import { useAuthStore } from '#/store';

defineOptions({ name: 'AccountSelection' });

const authStore = useAuthStore();
const router = useRouter();

const options = computed(() => authStore.accountSelectionOptions);
const accountCountText = computed(() => `${options.value.length} 个可用账号`);

// Returns users to login when the in-memory post-auth account selection state is no longer available.
watchEffect(() => {
  if (
    !authStore.hasPendingAccountSelection
    && !authStore.loginLoading
    && authStore.authBlockReason !== 'MFA_FACTOR_UNAVAILABLE'
  ) {
    void router.replace({ name: 'Login' });
  }
});

async function handleSelect(accountId: string) {
  await authStore.submitAccountSelection(accountId);
}

// Formats each selectable account card with stable copy for platform and tenant scopes.
function getContextMeta(option: {
  accountId: string;
  displayName?: string;
  scopeLevel?: 'SYSTEM' | 'TENANT';
  tenantId?: null | string;
  tenantName?: null | string;
}) {
  const isSystem = option.scopeLevel === 'SYSTEM';
  const tenantLabel = option.tenantName || option.tenantId;
  const accountLabel = option.displayName || option.accountId;
  return {
    badge: isSystem ? '平台账号' : '租户账号',
    description: isSystem
      ? '系统平台管理账号'
      : accountLabel
        ? `租户业务账号 · ${accountLabel}`
        : '租户业务账号',
    initial: (tenantLabel || accountLabel).slice(0, 1).toUpperCase(),
    title: isSystem ? accountLabel : tenantLabel || accountLabel,
  };
}
</script>

<template>
  <div v-if="authStore.hasPendingAccountSelection" class="space-y-5">
    <div class="space-y-2 text-center">
      <div class="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
        O
      </div>
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold">选择账号</h2>
        <p class="text-sm text-muted-foreground">
          当前身份已验证，请选择本次进入 OES 的平台账号或租户账号。
        </p>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ accountCountText }}</span>
        <span>可在登录后继续切换</span>
      </div>

      <div class="context-list space-y-2">
        <button
        v-for="option in options"
        :key="option.accountId"
          :disabled="authStore.loginLoading"
          class="context-option group w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-all hover:border-primary/60 hover:bg-accent/40 hover:shadow-md"
          type="button"
          @click="handleSelect(option.accountId)"
      >
          <div class="flex items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-foreground group-hover:bg-primary/10 group-hover:text-primary">
              {{ getContextMeta(option).initial }}
            </div>

            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-medium text-foreground">
                  {{ getContextMeta(option).title }}
                </span>
                <Tag
                  :color="option.scopeLevel === 'SYSTEM' ? 'blue' : 'default'"
                  class="m-0 shrink-0"
                >
                  {{ getContextMeta(option).badge }}
                </Tag>
              </div>
              <div class="truncate text-xs text-muted-foreground">
                {{ getContextMeta(option).description }}
              </div>
            </div>

            <span class="shrink-0 text-lg leading-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
              ›
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-list {
  max-height: min(52vh, 440px);
  overflow-y: auto;
  padding-right: 4px;
}

.context-list::-webkit-scrollbar {
  width: 6px;
}

.context-list::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 999px;
}

.context-option:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
</style>
