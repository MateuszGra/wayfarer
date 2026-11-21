<script setup lang="ts">
import { ref } from 'vue';
import { emailError, type EmailError } from '@shared/auth/email';
import { BaseButton } from '@/design-system';
import FormField from '@/shared/components/molecules/FormField/FormField.vue';
import { t } from '@/shared/i18n';

export interface Props {
  /** A request is on its way; the button waits instead of sending twice. */
  pending?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'ForgotPasswordForm' });
withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{ submit: [email: string] }>();

const email = ref('');
const fieldError = ref<EmailError | null>(null);

const submit = (): void => {
  fieldError.value = emailError(email.value);
  if (!fieldError.value) emit('submit', email.value.trim());
};
</script>

<template>
  <form class="forgot-password-form" novalidate @submit.prevent="submit">
    <p class="forgot-password-form__lead">{{ t('auth.forgotPassword.lead') }}</p>
    <FormField
      id="forgot-email"
      v-model="email"
      type="email"
      autocomplete="email"
      :label="t('auth.email')"
      :error="fieldError ? t(`auth.error.${fieldError}`) : null"
      data-testid="forgot-email"
    />
    <p v-if="error" class="forgot-password-form__error" role="alert" data-testid="forgot-error">{{ error }}</p>
    <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="forgot-submit">
      {{ t('auth.forgotPassword.submit') }}
    </BaseButton>
  </form>
</template>

<style scoped>
.forgot-password-form {
  display: grid;
  gap: var(--space-3);
}
.forgot-password-form__lead {
  margin: 0;
  color: var(--ink-dim);
}
.forgot-password-form__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
</style>
