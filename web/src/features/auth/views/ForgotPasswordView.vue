<script setup lang="ts">
import { useRouter } from 'vue-router';
import { BaseButton } from '@/design-system';
import { t } from '@/shared/i18n';
import AuthScreen from '../components/organisms/AuthScreen/AuthScreen.vue';
import ForgotPasswordForm from '../components/organisms/ForgotPasswordForm/ForgotPasswordForm.vue';
import { usePasswordReset } from '../composables/usePasswordReset';

defineOptions({ name: 'ForgotPasswordView' });

const router = useRouter();
const reset = usePasswordReset();
</script>

<template>
  <AuthScreen :title="t('auth.forgotPassword.title')">
    <p v-if="reset.requested.value" class="forgot-password__sent" role="status" data-testid="forgot-sent">
      {{ t('auth.forgotPassword.sent') }}
    </p>
    <ForgotPasswordForm v-else :pending="reset.pending.value" :error="reset.error.value" @submit="reset.request" />
    <BaseButton variant="link" class="forgot-password__link" data-testid="forgot-back" @click="router.push('/login')">
      {{ t('auth.forgotPassword.back') }}
    </BaseButton>
  </AuthScreen>
</template>

<style scoped>
.forgot-password__sent {
  margin: 0;
  color: var(--ink-dim);
}
.forgot-password__link {
  justify-self: center;
}
</style>
