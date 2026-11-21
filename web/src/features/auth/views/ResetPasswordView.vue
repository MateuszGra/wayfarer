<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BaseButton } from '@/design-system';
import { t } from '@/shared/i18n';
import AuthScreen from '../components/organisms/AuthScreen/AuthScreen.vue';
import ResetPasswordForm from '../components/organisms/ResetPasswordForm/ResetPasswordForm.vue';
import { usePasswordReset } from '../composables/usePasswordReset';

defineOptions({ name: 'ResetPasswordView' });

const route = useRoute();
const router = useRouter();
const reset = usePasswordReset();
const token = computed(() => (typeof route.query['token'] === 'string' ? route.query['token'] : ''));
</script>

<template>
  <AuthScreen :title="t('auth.resetPassword.title')">
    <ResetPasswordForm
      v-if="token"
      :pending="reset.pending.value"
      :error="reset.error.value"
      @submit="(password) => reset.reset(token, password)"
    />
    <p v-else class="reset-password__missing" role="alert" data-testid="reset-password-missing">
      {{ t('errors.reset_invalid') }}
    </p>
    <BaseButton
      variant="link"
      class="reset-password__link"
      data-testid="reset-password-new-link"
      @click="router.push('/forgot-password')"
    >
      {{ t('auth.resetPassword.newLink') }}
    </BaseButton>
  </AuthScreen>
</template>

<style scoped>
.reset-password__missing {
  margin: 0;
  color: var(--rust-deep);
}
.reset-password__link {
  justify-self: center;
}
</style>
