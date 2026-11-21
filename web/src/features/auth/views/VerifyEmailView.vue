<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BaseButton } from '@/design-system';
import { t } from '@/shared/i18n';
import AuthScreen from '../components/organisms/AuthScreen/AuthScreen.vue';
import { useEmailConfirmation } from '../composables/useEmailConfirmation';

defineOptions({ name: 'VerifyEmailView' });

const route = useRoute();
const router = useRouter();
const confirmation = useEmailConfirmation();
onMounted(() => void confirmation.confirm(route.query['token']));
</script>

<template>
  <AuthScreen :title="t('verifyEmail.title')">
    <p class="verify-email__text" role="status" data-testid="verify-email-status">
      <template v-if="confirmation.state.value === 'pending'">{{ t('verifyEmail.pending') }}</template>
      <template v-else-if="confirmation.state.value === 'done'">{{ t('verifyEmail.done') }}</template>
      <template v-else>{{ confirmation.error.value }} {{ t('verifyEmail.failedHint') }}</template>
    </p>
    <BaseButton
      v-if="confirmation.state.value === 'done'"
      variant="ink"
      block
      data-testid="verify-email-to-game"
      @click="router.push('/scene')"
    >
      {{ t('verifyEmail.toGame') }}
    </BaseButton>
    <BaseButton
      v-else-if="confirmation.state.value === 'failed'"
      variant="ink"
      block
      data-testid="verify-email-to-login"
      @click="router.push('/login')"
    >
      {{ t('verifyEmail.toLogin') }}
    </BaseButton>
  </AuthScreen>
</template>

<style scoped>
.verify-email__text {
  margin: 0;
  color: var(--ink-dim);
}
</style>
