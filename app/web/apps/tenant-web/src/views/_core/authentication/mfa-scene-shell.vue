<script lang="ts" setup>
import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

const props = withDefaults(defineProps<{
  canCycleFactor?: boolean;
  helpText: string;
  highlightLabel?: string;
  highlightTone?: 'blue' | 'green';
  highlightValue?: string;
  showHighlight?: boolean;
  title: string;
}>(), {
  canCycleFactor: false,
  highlightLabel: '',
  highlightTone: 'blue',
  highlightValue: '',
  showHighlight: false,
});
const emit = defineEmits<{
  cycleFactor: [];
}>();

const highlightClassName = computed(() =>
  props.highlightTone === 'green'
    ? 'mfa-factor-highlight mfa-factor-highlight--green'
    : 'mfa-factor-highlight mfa-factor-highlight--blue',
);
</script>

<template>
  <div class="mfa-factor-card">
    <div class="mfa-factor-header">
      <div class="mfa-factor-header__row">
        <h2>{{ title }}</h2>
        <div class="mfa-factor-header__actions">
          <Tooltip :title="helpText">
            <button class="mfa-factor-help" type="button" aria-label="查看说明">?</button>
          </Tooltip>
          <a
            v-if="canCycleFactor"
            class="mfa-factor-link"
            href="#"
            @click.prevent="emit('cycleFactor')"
          >
            使用其他方式
          </a>
        </div>
      </div>
    </div>

    <div
      v-if="showHighlight && highlightValue"
      :class="highlightClassName"
    >
      <span class="mfa-factor-highlight__label">{{ highlightLabel }}</span>
      <strong>{{ highlightValue }}</strong>
    </div>

    <slot></slot>
  </div>
</template>

<style scoped>
.mfa-factor-card {
  width: min(100%, 420px);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.08);
  padding: 24px;
}

.mfa-factor-header {
  margin-bottom: 20px;
}

.mfa-factor-header__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.mfa-factor-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mfa-factor-header h2 {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 24px;
  font-weight: 600;
}

.mfa-factor-link {
  color: rgb(37 99 235);
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
}

.mfa-factor-link:hover {
  color: rgb(29 78 216);
  text-decoration: underline;
}

.mfa-factor-help {
  width: 24px;
  height: 24px;
  border: 1px solid hsl(var(--border));
  border-radius: 9999px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.mfa-factor-highlight {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  color: hsl(var(--foreground));
}

.mfa-factor-highlight--blue {
  background: rgb(59 130 246 / 0.08);
}

.mfa-factor-highlight--green {
  background: rgb(34 197 94 / 0.08);
}

.mfa-factor-highlight__label {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
</style>
