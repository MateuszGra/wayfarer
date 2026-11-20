<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, newPasswordError, passwordRepeatError } from '@shared/auth/password';
import { emailError } from '@shared/auth/email';
import type { AuthFieldError } from '../../../validation';
import type { Credentials } from '../LoginForm/LoginForm.vue';

export interface Props {
  /** A request is on its way; the button waits instead of sending twice. */
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'RegisterForm' });
withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{ submit: [credentials: Credentials] }>();

const form = reactive({ email: '', password: '', repeat: '' });
const errors = ref<Record<'email' | 'password' | 'repeat', AuthFieldError | null>>({
  email: null,
  password: null,
  repeat: null,
});
const message = (error: AuthFieldError | null): string | null =>
  error ? t(`auth.error.${error}`, { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH }) : null;

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
      :hint="t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH })"
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
    <p v-if="error" class="register-form__error" role="alert" data-testid="register-error">{{ error }}</p>
    <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="register-submit">
      {{ t('auth.register.submit') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.register-form {
  display: grid;
  gap: var(--space-3);
}
.register-form__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
