<script setup lang="ts">
import { ref } from 'vue';
import { BaseCard, WorldEmblem } from '@/design-system';
import AuthTabs, { type AuthMode } from '../../molecules/AuthTabs/AuthTabs.vue';
import LoginForm, { type Credentials } from '../LoginForm/LoginForm.vue';
import RegisterForm from '../RegisterForm/RegisterForm.vue';

defineOptions({ name: 'AuthPanel' });
const emit = defineEmits<{
  login: [credentials: Credentials];
  register: [credentials: Credentials];
  'forgot-password': [];
}>();

const mode = ref<AuthMode>('login');
</script>

<template>
  <BaseCard square class="auth-panel">
    <WorldEmblem />
    <h1 class="auth-panel__title">Wayfarer</h1>
    <AuthTabs v-model="mode" class="auth-panel__tabs" />
    <LoginForm v-if="mode === 'login'" @submit="emit('login', $event)" @forgot-password="emit('forgot-password')" />
    <RegisterForm v-else @submit="emit('register', $event)" />
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
.auth-panel__tabs {
  margin-bottom: var(--space-4);
}
</style>
