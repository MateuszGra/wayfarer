<script setup lang="ts">
import PlaceholderScreen from '@/shared/components/organisms/PlaceholderScreen/PlaceholderScreen.vue';
import { t } from '@/shared/i18n';

defineOptions({ name: 'ForgotPasswordView' });
</script>

<template>
  <PlaceholderScreen :title="t('auth.forgotPassword.title')" />
</template>
