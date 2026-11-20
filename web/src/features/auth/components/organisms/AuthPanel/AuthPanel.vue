<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseCard, BaseTabs, WorldEmblem } from '@/design-system';
import { t } from '@/shared/i18n';
import LoginForm, { type Credentials } from '../LoginForm/LoginForm.vue';
import RegisterForm from '../RegisterForm/RegisterForm.vue';

export type AuthMode = 'login' | 'register';

export interface Props {
  pending?: boolean;
  /** The server's answer to the last attempt, in the player's words; cleared when the tab changes. */
  error?: string | null;
}

defineOptions({ name: 'AuthPanel' });
withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{
  login: [credentials: Credentials];
  register: [credentials: Credentials];
  'forgot-password': [];
  'mode-change': [mode: AuthMode];
}>();

const mode = ref<AuthMode>('login');
const tabs = [
  { value: 'login', label: t('auth.tab.login') },
  { value: 'register', label: t('auth.tab.register') },
] as const;
watch(mode, (next) => emit('mode-change', next));
</script>

<template>
  <BaseCard square class="auth-panel">
    <WorldEmblem />
    <h1 class="auth-panel__title">Wayfarer</h1>
    <BaseTabs v-model="mode" :tabs="tabs" :label="t('auth.tabs')">
      <template #login>
        <LoginForm
          :pending="pending"
          :error="error"
          @submit="emit('login', $event)"
          @forgot-password="emit('forgot-password')"
        />
      </template>
      <template #register>
        <RegisterForm :pending="pending" :error="error" @submit="emit('register', $event)" />
      </template>
    </BaseTabs>
  </BaseCard>
</template>

<style scoped>
.auth-panel__title {
  margin: var(--space-3) 0 var(--space-4);
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
}
</style>
