<script setup lang="ts">
import { useRouter } from 'vue-router';
import AuthBackdrop from '../components/organisms/AuthBackdrop/AuthBackdrop.vue';
import AuthPanel from '../components/organisms/AuthPanel/AuthPanel.vue';
import CheckEmailPanel from '../components/organisms/CheckEmailPanel/CheckEmailPanel.vue';
import { useAuthForms } from '../composables/useAuthForms';

defineOptions({ name: 'LoginView' });

const router = useRouter();
const auth = useAuthForms();
</script>

<template>
  <AuthBackdrop>
    <CheckEmailPanel
      v-if="auth.awaitingConfirmation.value"
      :email="auth.awaitingConfirmation.value"
      :pending="auth.pending.value"
      :resent="auth.resent.value"
      :error="auth.error.value"
      @confirm="auth.confirmCode"
      @resend="auth.resend"
      @back="auth.backToSignIn"
    />
    <AuthPanel
      v-else
      :pending="auth.pending.value"
      :error="auth.error.value"
      @login="auth.login"
      @register="auth.register"
      @mode-change="auth.clearError"
      @forgot-password="router.push('/forgot-password')"
    />
  </AuthBackdrop>
</template>
