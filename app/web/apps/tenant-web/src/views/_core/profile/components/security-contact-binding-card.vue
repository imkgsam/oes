<script setup lang="ts">
import type { SelfSecurityApi } from '#/api';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { SliderCaptcha } from '@vben/common-ui';

import { Alert, Button, Card, Form, Input, message, Modal, Steps } from 'ant-design-vue';

import {
  requestEmailBindingChallengeApi,
  requestPhoneBindingChallengeApi,
  verifyEmailBindingApi,
  verifyPhoneBindingApi,
} from '#/api';

import PhoneNumberInput from '../../authentication/phone-number-input.vue';
import {
  getContactBindingActionLabel,
  normalizeContactBindingValue,
  resolveBoundContact,
  resolveBoundContactIdentifier,
  validateContactBindingOtp,
  validateContactBindingValue,
} from '../security-center.helpers';
import SecurityStepUpMfaDialog from './security-step-up-mfa-dialog.vue';

type ContactBindingKind = 'email' | 'phone';

const props = defineProps<{
  kind: ContactBindingKind;
  loginMethods: SelfSecurityApi.LoginMethod[];
}>();

const emit = defineEmits<{
  refreshed: [];
}>();

const modalOpen = ref(false);
const stepUpMfaDialogRef = ref<null | {
  beginChallenge: (
    scenario: SelfSecurityApi.StepUpMfaScenario,
  ) => Promise<null | string>;
}>(null);
const activeStep = ref<'destination' | 'verification'>('destination');
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
const currentBindingIdentifier = computed(() =>
  resolveBoundContactIdentifier(props.loginMethods, props.kind),
);
const actionLabel = computed(() =>
  getContactBindingActionLabel(currentBinding.value),
);
const actionTitle = computed(() =>
  currentBinding.value ? `更换${kindLabel.value}` : `绑定${kindLabel.value}`,
);
const valuePlaceholder = computed(() =>
  props.kind === 'email' ? '请输入要绑定的新邮箱' : '请输入要绑定的新手机号',
);
const otpPlaceholder = computed(() =>
  props.kind === 'email' ? '请输入邮箱验证码' : '请输入短信验证码',
);
const challengeReady = computed(() => Boolean(formState.challengeExpiresAt));
const normalizedTargetValue = computed(() =>
  normalizeContactBindingValue(props.kind, formState.value),
);
const destinationValid = computed(() =>
  validateContactBindingValue(props.kind, formState.value) === '',
);
const bindingValueUnchanged = computed(() =>
  Boolean(normalizedTargetValue.value) &&
  normalizedTargetValue.value ===
    normalizeContactBindingValue(props.kind, currentBindingIdentifier.value),
);
const sendButtonLabel = computed(() => {
  if (resendCountdown.value > 0) {
    return `${resendCountdown.value} 秒后重发`;
  }

  return challengeReady.value ? '重新发送验证码' : '发送验证码';
});
const isDestinationStep = computed(() => activeStep.value === 'destination');
const canAdvanceToVerification = computed(() =>
  destinationValid.value &&
  Boolean(formState.value.trim()) &&
  !bindingValueUnchanged.value,
);
const shouldShowCaptchaPanel = computed(
  () => !challengeReady.value || resendCountdown.value === 0,
);
const shouldShowOtpPanel = computed(() => challengeReady.value);
const activeStepIndex = computed(() => (isDestinationStep.value ? 0 : 1));
const stepItems = computed(() => [
  { title: `填写新${kindLabel.value}` },
  { title: '验证并确认' },
]);

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
  activeStep.value = 'destination';
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
  resetFormState();
}

// Advances the replacement flow to the security verification step when the target is valid.
function goToVerificationStep() {
  formState.valueError = resolveValueValidationError();
  if (formState.valueError) {
    return;
  }

  activeStep.value = 'verification';
}

// Returns to the target entry step and clears pending verification state for a clean retry.
function goBackToDestinationStep() {
  activeStep.value = 'destination';
  resetChallengeState();
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
    formState.captchaVerified = false;
    formState.widgetVersion += 1;
    startResendCountdown();
    message.success(
      `${kindLabel.value}验证码已发送，请在有效期内完成验证`,
    );
  } catch (error) {
    message.error(resolveBindingRequestErrorMessage(error));
  } finally {
    challengeLoading.value = false;
  }
}

onBeforeUnmount(() => {
  resetResendCountdown();
});

// Verifies the submitted OTP and emits a refresh signal after the binding is replaced.
async function submitBinding() {
  formState.valueError = resolveValueValidationError();
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
    const mfaGrantToken = await stepUpMfaDialogRef.value?.beginChallenge(
      'CHANGE_CONTACT',
    );
    if (mfaGrantToken === null) {
      return;
    }

    await (
      props.kind === 'email'
        ? verifyEmailBindingApi({
            email: formState.value.trim(),
            mfaGrantToken: mfaGrantToken || undefined,
            otp: formState.otp.trim(),
          })
        : verifyPhoneBindingApi({
            mfaGrantToken: mfaGrantToken || undefined,
            otp: formState.otp.trim(),
            phone: formState.value.trim(),
          })
    );

    message.success(`${kindLabel.value}绑定已更新`);
    closeModal();
    emit('refreshed');
  } catch (error) {
    message.error(resolveBindingRequestErrorMessage(error));
  } finally {
    verifyLoading.value = false;
  }
}

function resolveBindingRequestErrorMessage(error: unknown) {
  const responseData = (error as any)?.response?.data ?? (error as any) ?? {};
  const detailField = `${responseData?.details?.field ?? ''}`.trim();

  if (detailField === 'email') {
    return '该邮箱已被其他账号使用，请更换后重试。';
  }

  if (detailField === 'phone') {
    return '该手机号已被其他账号使用，请更换后重试。';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return `${kindLabel.value}绑定更新失败，请稍后重试。`;
}

function resolveValueValidationError() {
  const formatError = validateContactBindingValue(props.kind, formState.value);
  if (formatError) {
    return formatError;
  }

  if (bindingValueUnchanged.value) {
    return `新${kindLabel.value}不能与当前绑定一致`;
  }

  return '';
}
</script>

<template>
  <Card :bordered="false" class="binding-card">
    <div class="binding-card__header">
      <div class="binding-card__heading">
        <div class="binding-card__title-row">
          <div class="binding-card__title">{{ kindLabel }}绑定</div>
        </div>
      </div>
      <Button class="binding-card__action" type="primary" ghost @click="openModal">
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
      :title="actionTitle"
      centered
      destroy-on-close
      width="640px"
      @cancel="closeModal"
    >
      <template #title>
        <div class="binding-modal__title-row">
          <span>{{ actionTitle }}</span>
        </div>
      </template>

      <div class="binding-modal">
        <Steps
          class="binding-modal__steps"
          :current="activeStepIndex"
          :items="stepItems"
          size="small"
        />

        <Form layout="vertical" class="binding-modal__form">
          <div class="binding-modal__section">
            <Alert
              class="binding-modal__alert"
              :message="`当前绑定：${currentBinding || `暂未绑定${kindLabel}`}`"
              show-icon
              type="info"
            />

            <template v-if="isDestinationStep">
              <Form.Item
                :help="formState.valueError || undefined"
                :label="`新${kindLabel}`"
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
            </template>

            <template v-else>
              <Alert
                class="binding-modal__alert"
                :message="`验证码将发送至 ${formState.value.trim()}`"
                show-icon
                type="info"
              />

              <div
                v-if="shouldShowCaptchaPanel"
                class="binding-modal__captcha"
              >
                <div class="binding-modal__caption">
                  {{ challengeReady ? '重新验证后发送验证码' : '完成安全验证后发送验证码' }}
                </div>
                <SliderCaptcha
                  :key="formState.widgetVersion"
                  v-model="formState.captchaVerified"
                  class="binding-modal__captcha-widget"
                  success-text="验证通过"
                  text="请按住滑块拖动"
                  @success="handleCaptchaSuccess"
                />
              </div>

              <div v-if="shouldShowOtpPanel" class="binding-modal__verification">
                <div class="binding-modal__caption binding-modal__caption--muted">
                  <div>验证码已发送至 {{ formState.challengeDestination }}</div>
                  <div>有效期至 {{ formatExpiration(formState.challengeExpiresAt) }}</div>
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
                  <div class="otp-row__side">
                    <Button
                      v-if="resendCountdown > 0"
                      class="otp-row__button"
                      disabled
                    >
                      {{ sendButtonLabel }}
                    </Button>
                    <span v-else class="binding-modal__resend-hint">可重新验证后发送</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="binding-modal__actions">
            <Button v-if="isDestinationStep" @click="closeModal">取消</Button>
            <Button v-else @click="goBackToDestinationStep">上一步</Button>
            <Button
              v-if="isDestinationStep"
              type="primary"
              :disabled="!canAdvanceToVerification"
              @click="goToVerificationStep"
            >
              下一步
            </Button>
            <Button
              v-else
              type="primary"
              :disabled="!challengeReady"
              :loading="verifyLoading"
              @click="submitBinding"
            >
              确认
            </Button>
          </div>
        </Form>
      </div>
    </Modal>

    <SecurityStepUpMfaDialog ref="stepUpMfaDialogRef" />
  </Card>
</template>

<style scoped>
.binding-card {
  --binding-border: hsl(var(--border));
  --binding-card-bg: hsl(var(--card));
  --binding-card-bg-soft: hsl(var(--muted) / 0.55);
  --binding-title: hsl(var(--foreground));
  --binding-muted: hsl(var(--muted-foreground));
  border: 1px solid var(--binding-border);
  background: var(--binding-card-bg);
  box-shadow: none;
}

.binding-card__header {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 12px;
}

.binding-card__heading {
  flex: 1 1 auto;
  min-width: 0;
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

.binding-card__action {
  align-self: center;
  flex: 0 0 auto;
  inline-size: max-content;
  margin-left: auto;
  max-inline-size: max-content;
  min-width: 88px;
  white-space: nowrap;
  width: max-content;
}

.binding-summary {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: hsl(var(--muted) / 0.35);
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
  gap: 16px;
}

.binding-modal,
.binding-modal__form {
  display: flex;
  flex-direction: column;
}

.binding-modal__title-row,
.binding-modal__surface-header,
.binding-target-summary {
  display: flex;
  align-items: center;
}

.binding-modal__title-row {
  justify-content: flex-start;
}

.binding-modal__steps {
  margin-bottom: 4px;
}

.binding-modal__form {
  gap: 16px;
}

.binding-modal__section {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--binding-border);
  border-radius: 8px;
  background: var(--binding-card-bg);
}

.binding-modal__alert :deep(.ant-alert) {
  border-color: hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
}

.binding-modal__captcha,
.binding-modal__verification {
  display: grid;
  gap: 12px;
}

.binding-modal__captcha {
  padding: 12px;
  border: 1px solid var(--binding-border);
  border-radius: 8px;
  background: hsl(var(--muted) / 0.18);
}

.binding-modal__caption {
  display: grid;
  gap: 4px;
  color: var(--binding-title);
  font-size: 13px;
  font-weight: 600;
}

.binding-modal__caption--muted {
  color: var(--binding-muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
}

.binding-modal__captcha-widget {
  width: 100%;
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

.otp-row__side {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  min-height: 100%;
}

.binding-modal__resend-hint {
  color: var(--binding-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
}

.binding-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .binding-summary__row {
    flex-direction: column;
    align-items: stretch;
  }

  .binding-card__header {
    gap: 8px;
  }

  .binding-card__action {
    inline-size: max-content;
    max-inline-size: max-content;
    min-width: 84px;
    padding-inline: 14px;
    width: max-content;
  }

  .otp-row {
    grid-template-columns: 1fr;
  }

  .otp-row__side {
    justify-content: flex-start;
  }

  .binding-modal__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .otp-row__button {
    margin-top: 0;
  }
}
</style>
