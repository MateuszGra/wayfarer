<script setup lang="ts">
import { reactive, ref } from 'vue';
import {
  existingPasswordError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  newPasswordError,
  passwordRepeatError,
  passwordUnchangedError,
  type PasswordError,
} from '@shared/auth/password';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface Props {
  /** A request is on its way; the button waits instead of sending twice. */
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'ChangePasswordForm' });
withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{ submit: [change: PasswordChange] }>();

const form = reactive({ current: '', next: '', repeat: '' });
const errors = ref<Record<'current' | 'next' | 'repeat', PasswordError | null>>({
  current: null,
  next: null,
  repeat: null,
});
const message = (error: PasswordError | null): string | null =>
  error ? t(`auth.error.${error}`, { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH }) : null;

const submit = (): void => {
  const next = newPasswordError(form.next) ?? passwordUnchangedError(form.current, form.next);
  errors.value = {
    current: existingPasswordError(form.current),
    next,
    repeat: next ? null : passwordRepeatError(form.next, form.repeat),
  };
  if (errors.value.current || errors.value.next || errors.value.repeat) return;
  emit('submit', { currentPassword: form.current, newPassword: form.next });
};
</script>

<template>
  <form class="change-password-form" novalidate @submit.prevent="submit">
    <FormField
      id="settings-password-current"
      v-model="form.current"
      type="password"
      autocomplete="current-password"
      :label="t('settings.password.current')"
      :error="message(errors.current)"
      data-testid="settings-password-current"
    />
    <FormField
      id="settings-password-new"
      v-model="form.next"
      type="password"
      autocomplete="new-password"
      :label="t('settings.password.new')"
      :hint="t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH })"
      :error="message(errors.next)"
      data-testid="settings-password-new"
    />
    <FormField
      id="settings-password-repeat"
      v-model="form.repeat"
      type="password"
      autocomplete="new-password"
      :label="t('settings.password.repeat')"
      :error="message(errors.repeat)"
      data-testid="settings-password-repeat"
    />
    <p v-if="error" class="change-password-form__error" role="alert" data-testid="settings-password-error">
      {{ error }}
    </p>
    <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="settings-password-submit">
      {{ t('settings.password.submit') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.change-password-form {
  display: grid;
  gap: var(--space-3);
}
.change-password-form__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
