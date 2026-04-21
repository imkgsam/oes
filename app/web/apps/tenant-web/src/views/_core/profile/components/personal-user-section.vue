<script setup lang="ts">
import type { PersonalCenterApi } from '#/api/bff/personal-center';

import { computed } from 'vue';

import { Card, Tag, Tooltip } from 'ant-design-vue';

const props = defineProps<{
  userProfile: PersonalCenterApi.UserProfile;
}>();

const loginMethods = computed(() => props.userProfile.loginMethods ?? []);
</script>

<template>
  <Card :bordered="false" class="section-card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-xl font-semibold text-foreground">
          登录身份信息
          <Tooltip title="这里是 user 级登录身份信息，只展示登录邮箱、登录手机号和登录方式。">
            <span class="help-dot">?</span>
          </Tooltip>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <div class="field-label">登录方式</div>
      <div class="mt-3 flex flex-wrap gap-2">
        <Tag
          v-for="method in loginMethods"
          :key="`${method.type}-${method.value || method.label}`"
          color="blue"
        >
          {{ method.label }}<span v-if="method.value"> · {{ method.value }}</span>
        </Tag>
        <Tag v-if="loginMethods.length === 0" color="default">暂无登录方式摘要</Tag>
      </div>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <div class="field-card">
        <div class="field-label">登录邮箱</div>
        <div class="field-value">{{ userProfile.loginEmail || '未绑定' }}</div>
      </div>
      <div class="field-card">
        <div class="field-label">登录手机号</div>
        <div class="field-value">{{ userProfile.loginPhone || '未绑定' }}</div>
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

.field-card {
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  padding: 16px 18px;
  background: hsl(var(--muted) / 0.45);
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
