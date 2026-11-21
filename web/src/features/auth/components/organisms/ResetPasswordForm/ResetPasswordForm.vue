<script setup lang="ts">
import { reactive, ref } from 'vue';
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  newPasswordError,
  passwordRepeatError,
  type PasswordError,
} from '@shared/auth/password';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';

export interface Props {
  /** A request is on its way; the button waits instead of sending twice. */
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'ResetPasswordForm' });
withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{ submit: [newPassword: string] }>();

const form = reactive({ next: '', repeat: '' });
const errors = ref<Record<'next' | 'repeat', PasswordError | null>>({ next: null, repeat: null });
const message = (error: PasswordError | null): string | null =>
  error ? t(`auth.error.${error}`, { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH }) : null;

const submit = (): void => {
  const next = newPasswordError(form.next);
  errors.value = { next, repeat: next ? null : passwordRepeatError(form.next, form.repeat) };
  if (!errors.value.next && !errors.value.repeat) emit('submit', form.next);
};
</script>

<template>
  <form class="reset-password-form" novalidate @submit.prevent="submit">
    <FormField
      id="reset-password-new"
      v-model="form.next"
      type="password"
      autocomplete="new-password"
      :label="t('settings.password.new')"
      :hint="t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH })"
      :error="message(errors.next)"
      data-testid="reset-password-new"
    />
    <FormField
      id="reset-password-repeat"
      v-model="form.repeat"
      type="password"
      autocomplete="new-password"
      :label="t('settings.password.repeat')"
      :error="message(errors.repeat)"
      data-testid="reset-password-repeat"
    />
    <p v-if="error" class="reset-password-form__error" role="alert" data-testid="reset-password-error">{{ error }}</p>
    <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="reset-password-submit">
      {{ t('auth.resetPassword.submit') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.reset-password-form {
  display: grid;
  gap: var(--space-3);
}
.reset-password-form__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
