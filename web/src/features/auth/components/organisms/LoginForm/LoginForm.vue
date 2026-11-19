<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';
import { emailError, loginPasswordError, type AuthFieldError } from '../../../validation';

export interface Credentials {
  email: string;
  password: string;
}

defineOptions({ name: 'LoginForm' });
const emit = defineEmits<{ submit: [credentials: Credentials]; 'forgot-password': [] }>();

const form = reactive({ email: '', password: '' });
const errors = ref<{ email: AuthFieldError | null; password: AuthFieldError | null }>({ email: null, password: null });
const message = (error: AuthFieldError | null): string | null => (error ? t(`auth.error.${error}`) : null);

const submit = (): void => {
  errors.value = { email: emailError(form.email), password: loginPasswordError(form.password) };
  if (errors.value.email || errors.value.password) return;
  emit('submit', { email: form.email.trim(), password: form.password });
};
</script>

<template>
  <form class="login-form" novalidate @submit.prevent="submit">
    <FormField
      id="login-email"
      v-model="form.email"
      type="email"
      autocomplete="email"
      :label="t('auth.email')"
      :error="message(errors.email)"
      data-testid="login-email"
    />
    <FormField
      id="login-password"
      v-model="form.password"
      type="password"
      autocomplete="current-password"
      :label="t('auth.password')"
      :error="message(errors.password)"
      data-testid="login-password"
    />
    <BaseButton type="submit" variant="ink" block data-testid="login-submit">{{ t('auth.login.submit') }}</BaseButton>
    <BaseButton variant="link" class="login-form__forgot" data-testid="login-forgot" @click="emit('forgot-password')">
      {{ t('auth.forgotPassword') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.login-form {
  display: grid;
  gap: var(--space-3);
}
.login-form__forgot {
  justify-self: center;
}
</style>
