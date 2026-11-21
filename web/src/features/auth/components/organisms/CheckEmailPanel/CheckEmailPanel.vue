<script setup lang="ts">
import { ref } from 'vue';
import { normalizeVerificationCode } from '@shared/auth/verificationCode';
import { BaseButton, BaseCodeInput } from '@/design-system';
import { t } from '@/shared/i18n';
import AuthCard from '../AuthCard/AuthCard.vue';

export interface Props {
  /** Where the confirmation e-mail went. */
  email: string;
  /** A request is on its way; the buttons wait instead of sending twice. */
  pending?: boolean;
  /** A fresh e-mail was just sent. */
  resent?: boolean;
  /** What the server said went wrong, already in the player's words. */
  error?: string | null;
}

defineOptions({ name: 'CheckEmailPanel' });
withDefaults(defineProps<Props>(), { pending: false, resent: false, error: null });
const emit = defineEmits<{ confirm: [code: string]; resend: []; back: [] }>();

const code = ref('');
const codeInvalid = ref(false);

const submit = (): void => {
  const digits = normalizeVerificationCode(code.value);
  codeInvalid.value = digits === null;
  if (digits) emit('confirm', digits);
};
const digitLabel = (position: number, length: number): string => t('auth.checkEmail.digit', { position, length });
</script>

<template>
  <AuthCard :title="t('auth.checkEmail.title')" data-testid="check-email">
    <form class="check-email__body" novalidate @submit.prevent="submit">
      <p class="check-email__text" data-testid="check-email-lead">{{ t('auth.checkEmail.lead', { email }) }}</p>
      <p id="check-email-code-label" class="check-email__label">{{ t('auth.checkEmail.code') }}</p>
      <!-- The sixth digit sends the code at once, typed or pasted; the button stays for those who look for it. -->
      <BaseCodeInput
        v-model="code"
        labelled-by="check-email-code-label"
        :digit-label="digitLabel"
        :invalid="codeInvalid || !!error"
        :described-by="codeInvalid ? 'check-email-code-error' : error ? 'check-email-error' : undefined"
        :disabled="pending"
        data-testid="check-email-code"
        @complete="submit"
      />
      <p v-if="codeInvalid" id="check-email-code-error" class="check-email__error" data-testid="check-email-code-error">
        {{ t('auth.checkEmail.codeInvalid') }}
      </p>
      <p v-if="resent" class="check-email__text" role="status" data-testid="check-email-resent">
        {{ t('auth.checkEmail.resent') }}
      </p>
      <p v-if="error" id="check-email-error" class="check-email__error" role="alert" data-testid="check-email-error">
        {{ error }}
      </p>
      <BaseButton type="submit" variant="ink" block :disabled="pending" data-testid="check-email-confirm">
        {{ t('auth.checkEmail.confirm') }}
      </BaseButton>
      <BaseButton
        variant="link"
        class="check-email__link"
        :disabled="pending"
        data-testid="check-email-resend"
        @click="emit('resend')"
      >
        {{ t('auth.checkEmail.resend') }}
      </BaseButton>
      <BaseButton variant="link" class="check-email__link" data-testid="check-email-back" @click="emit('back')">
        {{ t('auth.checkEmail.back') }}
      </BaseButton>
    </form>
  </AuthCard>
</template>

<style scoped>
.check-email__body {
  display: grid;
  gap: var(--space-3);
}
.check-email__label {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
}
.check-email__text {
  margin: 0;
  color: var(--ink-dim);
}
.check-email__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--rust-deep);
}
.check-email__link {
  justify-self: center;
}
</style>
