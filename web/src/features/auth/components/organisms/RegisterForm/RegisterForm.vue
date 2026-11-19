<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';
import {
  emailError,
  MIN_PASSWORD_LENGTH,
  newPasswordError,
  passwordRepeatError,
  type AuthFieldError,
} from '../../../validation';
import type { Credentials } from '../LoginForm/LoginForm.vue';

defineOptions({ name: 'RegisterForm' });
const emit = defineEmits<{ submit: [credentials: Credentials] }>();

const form = reactive({ email: '', password: '', repeat: '' });
const errors = ref<Record<'email' | 'password' | 'repeat', AuthFieldError | null>>({
  email: null,
  password: null,
  repeat: null,
});
const message = (error: AuthFieldError | null): string | null =>
  error ? t(`auth.error.${error}`, { min: MIN_PASSWORD_LENGTH }) : null;

const submit = (): void => {
  const password = newPasswordError(form.password);
  errors.value = {
    email: emailError(form.email),
    password,
    repeat: password ? null : passwordRepeatError(form.password, form.repeat),
  };
  if (errors.value.email || errors.value.password || errors.value.repeat) return;
  emit('submit', { email: form.email.trim(), password: form.password });
};
</script>

<template>
  <form class="register-form" novalidate @submit.prevent="submit">
    <FormField
      id="register-email"
      v-model="form.email"
      type="email"
      autocomplete="email"
      :label="t('auth.email')"
      :error="message(errors.email)"
      data-testid="register-email"
    />
    <FormField
      id="register-password"
      v-model="form.password"
      type="password"
      autocomplete="new-password"
      :label="t('auth.password')"
      :error="message(errors.password)"
      data-testid="register-password"
    />
    <FormField
      id="register-repeat"
      v-model="form.repeat"
      type="password"
      autocomplete="new-password"
      :label="t('auth.passwordRepeat')"
      :error="message(errors.repeat)"
      data-testid="register-repeat"
    />
    <BaseButton type="submit" variant="ink" block data-testid="register-submit">
      {{ t('auth.register.submit') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.register-form {
  display: grid;
  gap: var(--space-3);
}
</style>
