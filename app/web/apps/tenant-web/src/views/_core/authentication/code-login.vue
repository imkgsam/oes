<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationCodeLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import PhoneNumberInput from './phone-number-input.vue';

defineOptions({ name: 'CodeLogin' });

const loading = ref(false);
const CODE_LENGTH = 6;
const authStore = useAuthStore();
const formRef = ref<InstanceType<typeof AuthenticationCodeLogin>>();
const route = useRoute();
const router = useRouter();
const sliderPassed = ref(false);
const sliderRef = ref<InstanceType<typeof SliderCaptcha>>();

type LoginMode = 'email' | 'phone';

const loginMode = computed<LoginMode>(() => {
  return route.query.mode === 'email' ? 'email' : 'phone';
});

const isEmailMode = computed(() => loginMode.value === 'email');
const loginPath = computed(() => `/auth/login?mode=${loginMode.value}`);
const routeIdentifier = computed(() => `${route.query.identifier ?? ''}`.trim());

// Converts rejected OTP login attempts into user-facing feedback without leaking unhandled promise errors.
function handleCodeLoginError() {
  resetSlider();
}

const formSchema = computed((): VbenFormSchema[] => {
  const codeField: VbenFormSchema = {
    component: 'VbenPinInput',
    componentProps: {
      codeLength: CODE_LENGTH,
      createText: (countdown: number) => {
        const text =
          countdown > 0
            ? $t('authentication.sendText', [countdown])
            : $t('authentication.sendCode');
        return text;
      },
      placeholder: $t('authentication.code'),
      handleSendCode: async () => {
        const formApi = formRef.value?.getFormApi();
        const values = await formApi?.getValues?.();
        if (isEmailMode.value) {
          const email = `${values?.email ?? ''}`.trim();
          await authStore.requestEmailOtpChallenge(email);
          message.success('验证码已发送，请注意查收邮件。');
          return;
        }

        const phone = `${values?.phoneNumber ?? ''}`.trim();
        await authStore.requestPhoneOtpChallenge(phone);
        message.success('验证码已发送，请注意查收短信。');
      },
    },
    fieldName: 'code',
    label: $t('authentication.code'),
    rules: z.string().length(CODE_LENGTH, {
      message: $t('authentication.codeTip', [CODE_LENGTH]),
    }),
  };

  const phoneSchema: VbenFormSchema[] = [
    {
      component: PhoneNumberInput,
      componentProps: {
        placeholder: '请输入手机号',
      },
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(6, { message: $t('authentication.mobileTip') })
        .refine((v) => /^\+\d{6,20}$/.test(`${v ?? ''}`.trim()), {
          message: '请输入正确的手机号',
        }),
    },
    codeField,
  ];

  const emailSchema: VbenFormSchema[] = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: 'name@company.com',
      },
      fieldName: 'email',
      label: '邮箱',
      rules: z.string().email({ message: '请输入有效邮箱地址' }),
    },
    codeField,
  ];

  return isEmailMode.value ? emailSchema : phoneSchema;
});

// Submits the OTP login form using either the email or phone identifier mode.
async function handleLogin(values: Recordable<any>) {
  if (!sliderPassed.value) {
    return;
  }

  if (isEmailMode.value) {
    try {
      await authStore.authEmailCodeLogin(values);
      return;
    } catch {
      handleCodeLoginError();
    }
    return;
  }

  try {
    await authStore.authCodeLogin({
      code: values.code,
      phoneNumber: values.phoneNumber,
    });
  } catch {
    handleCodeLoginError();
  }
}

function switchMode(mode: LoginMode) {
  resetSlider();
  void router.replace({
    name: 'CodeLogin',
    query: { mode },
  });
}

function resetSlider() {
  sliderPassed.value = false;
  sliderRef.value?.resume?.();
}

// syncIdentifierFromRoute carries an identifier handed off from password login into the current OTP mode.
function syncIdentifierFromRoute() {
  if (!routeIdentifier.value) {
    return;
  }

  formRef.value
    ?.getFormApi?.()
    .setFieldValue(isEmailMode.value ? 'email' : 'phoneNumber', routeIdentifier.value);
}

onMounted(syncIdentifierFromRoute);

watch(() => [loginMode.value, routeIdentifier.value] as const, syncIdentifierFromRoute);
</script>

<template>
  <div class="space-y-4">
    <AuthenticationCodeLogin
      ref="formRef"
      :form-schema="formSchema"
      :login-path="loginPath"
      :loading="loading || authStore.loginLoading"
      :sub-title="
        isEmailMode
          ? '使用邮箱验证码登录 OES 租户业务 Web'
          : '使用手机验证码登录 OES 租户业务 Web'
      "
      :title="isEmailMode ? '邮箱验证码登录' : '短信验证码登录'"
      @submit="handleLogin"
    >
      <template #form-prepend>
        <div class="mb-5 flex items-center gap-10">
          <button
            :class="
              isEmailMode
                ? 'border-transparent text-muted-foreground'
                : 'border-primary text-primary'
            "
            class="border-b-[3px] pb-2 text-sm font-medium transition-colors"
            type="button"
            @click="switchMode('phone')"
          >
            手机号
          </button>
          <button
            :class="
              isEmailMode
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            "
            class="border-b-[3px] pb-2 text-sm font-medium transition-colors"
            type="button"
            @click="switchMode('email')"
          >
            邮箱
          </button>
        </div>
      </template>

      <template #submit-prepend>
        <div class="mb-4">
          <SliderCaptcha
            ref="sliderRef"
            v-model="sliderPassed"
            success-text="验证通过"
            text="请按住滑块拖动"
          />
        </div>
      </template>
    </AuthenticationCodeLogin>
  </div>
</template>
