<script setup lang="ts">
import type { SelfSecurityApi } from '#/api';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { SliderCaptcha } from '@vben/common-ui';
import { Button, Card, Form, Input, Modal, Tooltip, message } from 'ant-design-vue';

import {
  requestEmailBindingChallengeApi,
  requestPhoneBindingChallengeApi,
  verifyEmailBindingApi,
  verifyPhoneBindingApi,
} from '#/api';

import {
  getContactBindingActionLabel,
  resolveBoundContact,
  validateContactBindingOtp,
  validateContactBindingValue,
} from '../security-center.helpers';
import PhoneNumberInput from '../../authentication/phone-number-input.vue';

type ContactBindingKind = 'email' | 'phone';

const props = defineProps<{
  kind: ContactBindingKind;
  loginMethods: SelfSecurityApi.LoginMethod[];
}>();

const emit = defineEmits<{
  refreshed: [];
}>();

const modalOpen = ref(false);
const captchaModalOpen = ref(false);
const challengeLoading = ref(false);
const resendCountdown = ref(0);
const resendTimer = ref<ReturnType<typeof setTimeout>>();
const verifyLoading = ref(false);
const formState = reactive({
  captchaVerified: false,
  challengeDestination: '',
  challengeExpiresAt: '',
  otp: '',
  otpError: '',
  value: '',
  valueError: '',
  widgetVersion: 0,
});

const kindLabel = computed(() => (props.kind === 'email' ? '邮箱' : '手机'));
const currentBinding = computed(() =>
  resolveBoundContact(props.loginMethods, props.kind),
);
const actionLabel = computed(() =>
  getContactBindingActionLabel(currentBinding.value),
);
const valuePlaceholder = computed(() =>
  props.kind === 'email' ? '请输入要绑定的新邮箱' : '请输入要绑定的新手机号',
);
const otpPlaceholder = computed(() =>
  props.kind === 'email' ? '请输入邮箱验证码' : '请输入短信验证码',
);
const challengeReady = computed(() => Boolean(formState.challengeExpiresAt));
const destinationValid = computed(() =>
  validateContactBindingValue(props.kind, formState.value) === '',
);
const sendButtonLabel = computed(() =>
  resendCountdown.value > 0 ? `${resendCountdown.value} 秒后重发` : challengeReady.value ? '重新发送验证码' : '发送验证码',
);
const sendButtonDisabled = computed(
  () =>
    challengeLoading.value ||
    resendCountdown.value > 0 ||
    !formState.value.trim() ||
    !destinationValid.value,
);

watch(
  () => formState.value,
  (value, previousValue) => {
    if (value === previousValue) {
      return;
    }

    formState.valueError = '';
    resetChallengeState();
  },
);

watch(
  () => formState.otp,
  () => {
    formState.otpError = '';
  },
);

// Resets one pending captcha / OTP exchange whenever the target contact changes.
function resetChallengeState() {
  formState.captchaVerified = false;
  formState.challengeDestination = '';
  formState.challengeExpiresAt = '';
  formState.otp = '';
  formState.otpError = '';
  formState.widgetVersion += 1;
  resetResendCountdown();
}

// Restores the entire binding modal state to its first-open defaults.
function resetFormState() {
  formState.value = '';
  formState.valueError = '';
  resetChallengeState();
}

// Opens the shared bind-or-replace flow for the selected contact kind.
function openModal() {
  resetFormState();
  modalOpen.value = true;
}

// Closes the binding modal and clears transient challenge state.
function closeModal() {
  modalOpen.value = false;
  closeCaptchaModal();
  resetFormState();
}

// Opens the verification dialog only when the user explicitly requests an OTP.
function openCaptchaModal() {
  formState.captchaVerified = false;
  formState.widgetVersion += 1;
  captchaModalOpen.value = true;
}

// Closes the OTP verification dialog and clears its transient state.
function closeCaptchaModal() {
  captchaModalOpen.value = false;
  formState.captchaVerified = false;
}

// Clears the resend timer so the button can return to its default state.
function resetResendCountdown() {
  resendCountdown.value = 0;
  clearTimeout(resendTimer.value);
}

// Starts the resend cooldown after one OTP challenge is successfully sent.
function startResendCountdown() {
  resetResendCountdown();
  resendCountdown.value = 60;

  const tick = () => {
    if (resendCountdown.value <= 0) {
      return;
    }

    resendTimer.value = setTimeout(() => {
      resendCountdown.value -= 1;
      tick();
    }, 1000);
  };

  tick();
}

// Records that the slider gate has passed and then sends the OTP challenge.
async function handleCaptchaSuccess() {
  formState.captchaVerified = true;
  closeCaptchaModal();
  message.success('滑动验证已通过');
  await sendChallengeRequest();
}

// Formats the challenge expiration timestamp for concise inline display.
function formatExpiration(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

// Sends one OTP challenge to the current replacement destination.
async function sendChallengeRequest() {
  challengeLoading.value = true;
  try {
    const result =
      props.kind === 'email'
        ? await requestEmailBindingChallengeApi({ email: formState.value.trim() })
        : await requestPhoneBindingChallengeApi({ phone: formState.value.trim() });

    formState.challengeDestination = result.destination;
    formState.challengeExpiresAt = result.expiresAt;
    startResendCountdown();
    message.success(
      `${kindLabel.value}验证码已发送，请在有效期内完成验证`,
    );
  } finally {
    challengeLoading.value = false;
  }
}

// Validates the destination first, then opens the verification dialog.
function requestChallenge() {
  formState.valueError = validateContactBindingValue(props.kind, formState.value);
  if (formState.valueError) {
    return;
  }

  openCaptchaModal();
}

onBeforeUnmount(() => {
  resetResendCountdown();
});

// Verifies the submitted OTP and emits a refresh signal after the binding is replaced.
async function submitBinding() {
  formState.valueError = validateContactBindingValue(props.kind, formState.value);
  formState.otpError = validateContactBindingOtp(formState.otp);

  if (formState.valueError || formState.otpError) {
    return;
  }

  if (!challengeReady.value) {
    message.warning('请先发送验证码');
    return;
  }

  verifyLoading.value = true;
  try {
    if (props.kind === 'email') {
      await verifyEmailBindingApi({
        email: formState.value.trim(),
        otp: formState.otp.trim(),
      });
    } else {
      await verifyPhoneBindingApi({
        otp: formState.otp.trim(),
        phone: formState.value.trim(),
      });
    }

    message.success(`${kindLabel.value}绑定已更新`);
    closeModal();
    emit('refreshed');
  } finally {
    verifyLoading.value = false;
  }
}
</script>

<template>
  <Card :bordered="false" class="binding-card">
    <div class="binding-card__header">
      <div>
        <div class="binding-card__title-row">
          <div class="binding-card__title">{{ kindLabel }}绑定</div>
          <Tooltip :title="`验证通过后会直接替换当前${kindLabel}绑定`">
            <span class="binding-help-dot">?</span>
          </Tooltip>
        </div>
      </div>
      <Button type="primary" ghost @click="openModal">
        {{ actionLabel }}
      </Button>
    </div>

    <div class="binding-summary">
      <div class="binding-summary__row">
        <span>当前绑定</span>
        <strong>{{ currentBinding || `暂未绑定${kindLabel}` }}</strong>
      </div>
    </div>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="verifyLoading"
      :footer="null"
      :title="`${actionLabel}${kindLabel}`"
      centered
      destroy-on-close
      width="680px"
      @cancel="closeModal"
    >
      <template #title>
        <div class="binding-modal__title-row">
          <span>{{ `${actionLabel}${kindLabel}` }}</span>
          <Tooltip :title="`验证成功后将直接替换当前${kindLabel}绑定，旧绑定不会保留`">
            <span class="binding-help-dot">?</span>
          </Tooltip>
        </div>
      </template>

      <div class="binding-modal">
        <Form layout="vertical" class="binding-modal__form">
          <div class="binding-modal__surface">
            <div class="binding-modal__surface-header">
              <div class="binding-modal__surface-title">
                新{{ kindLabel }}
              </div>
              <div class="binding-modal__surface-meta">
                {{ currentBinding || `当前未绑定${kindLabel}` }}
              </div>
            </div>

            <Form.Item
              :help="formState.valueError || undefined"
              :label="`${kindLabel}地址`"
              :validate-status="formState.valueError ? 'error' : undefined"
            >
              <PhoneNumberInput
                v-if="props.kind === 'phone'"
                v-model="formState.value"
                :placeholder="valuePlaceholder"
              />
              <Input
                v-else
                v-model:value="formState.value"
                :placeholder="valuePlaceholder"
              />
            </Form.Item>
          </div>

          <div class="binding-modal__surface">
            <div class="binding-modal__surface-header">
              <div class="binding-modal__surface-title">验证码确认</div>
              <Tooltip title="验证码发送到你填写的新绑定目标，验证成功后才会正式替换">
                <span class="binding-help-dot binding-help-dot--small">?</span>
              </Tooltip>
            </div>

            <div v-if="challengeReady" class="challenge-summary">
              <div>发送目标：{{ formState.challengeDestination }}</div>
              <div>失效时间：{{ formatExpiration(formState.challengeExpiresAt) }}</div>
            </div>

            <div class="otp-row">
              <Form.Item
                class="otp-row__input"
                :help="formState.otpError || undefined"
                label="验证码"
                :validate-status="formState.otpError ? 'error' : undefined"
              >
                <Input
                  v-model:value="formState.otp"
                  :maxlength="6"
                  :placeholder="otpPlaceholder"
                />
              </Form.Item>
              <Button
                class="otp-row__button"
                :disabled="sendButtonDisabled"
                :loading="challengeLoading"
                @click="requestChallenge"
              >
                {{ sendButtonLabel }}
              </Button>
            </div>
          </div>

          <div class="binding-modal__actions">
            <Button @click="closeModal">取消</Button>
            <Button
              type="primary"
              :loading="verifyLoading"
              @click="submitBinding"
            >
              确认绑定
            </Button>
          </div>
        </Form>
      </div>
    </Modal>

    <Modal
      :footer="null"
      :open="captchaModalOpen"
      centered
      destroy-on-close
      width="420px"
      @cancel="closeCaptchaModal"
    >
      <template #title>
        <div class="binding-modal__title-row">
          <span>发送前验证</span>
          <Tooltip title="完成一次滑动验证后，才会真正发送验证码">
            <span class="binding-help-dot">?</span>
          </Tooltip>
        </div>
      </template>

      <div class="captcha-modal">
        <div class="captcha-modal__meta">
          {{ kindLabel }}验证码将发送到你填写的新绑定目标
        </div>
        <SliderCaptcha
          :key="formState.widgetVersion"
          v-model="formState.captchaVerified"
          success-text="验证通过"
          text="请按住滑块拖动"
          @success="handleCaptchaSuccess"
        />
      </div>
    </Modal>
  </Card>
</template>

<style scoped>
.binding-card {
  --binding-border: hsl(var(--border));
  --binding-card-bg: hsl(var(--card));
  --binding-card-bg-soft: hsl(var(--muted) / 0.55);
  --binding-card-bg-strong: hsl(var(--muted) / 0.82);
  --binding-card-bg-accent:
    linear-gradient(180deg, hsl(var(--card)), hsl(var(--muted) / 0.72));
  --binding-title: hsl(var(--foreground));
  --binding-text: hsl(var(--foreground) / 0.92);
  --binding-muted: hsl(var(--muted-foreground));
  border: 1px solid var(--binding-border);
  background: var(--binding-card-bg);
  box-shadow: none;
}

.binding-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.binding-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.binding-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--binding-title);
}

.binding-summary {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  background: var(--binding-card-bg-strong);
  border: 1px solid var(--binding-border);
}

.binding-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--binding-muted);
}

.binding-summary__row strong {
  color: var(--binding-title);
  font-weight: 600;
  text-align: right;
}

.binding-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.binding-modal__title-row,
.binding-modal__surface-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.binding-modal__title-row {
  justify-content: flex-start;
}

.binding-modal__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.binding-modal__surface {
  padding: 16px;
  border: 1px solid var(--binding-border);
  border-radius: 16px;
  background: var(--binding-card-bg-accent);
}

.binding-modal__surface-header {
  justify-content: space-between;
  margin-bottom: 14px;
}

.binding-modal__surface-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--binding-title);
}

.binding-modal__surface-meta {
  font-size: 12px;
  color: var(--binding-muted);
  text-align: right;
}

.challenge-summary {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--binding-card-bg-strong);
  font-size: 12px;
  color: var(--binding-muted);
}

.otp-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 12px;
  align-items: flex-start;
}

.otp-row__input {
  margin-bottom: 0;
}

.otp-row__button {
  margin-top: 30px;
}

.binding-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.captcha-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.captcha-modal__meta {
  font-size: 12px;
  color: var(--binding-muted);
  line-height: 1.6;
}

.binding-help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid var(--binding-border);
  border-radius: 9999px;
  background: var(--binding-card-bg-strong);
  color: var(--binding-muted);
  font-size: 11px;
  line-height: 1;
  cursor: help;
}

.binding-help-dot--small {
  width: 16px;
  height: 16px;
  font-size: 10px;
}

@media (max-width: 768px) {
  .binding-card__header,
  .binding-summary__row,
  .binding-modal__surface-header {
    flex-direction: column;
    align-items: stretch;
  }

  .otp-row {
    grid-template-columns: 1fr;
  }

  .otp-row__button {
    margin-top: 0;
  }
}
</style>
