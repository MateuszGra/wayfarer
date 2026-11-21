<script setup lang="ts">
import AuthBackdrop from '../AuthBackdrop/AuthBackdrop.vue';
import AuthCard from '../AuthCard/AuthCard.vue';

export interface Props {
  title: string;
}

defineOptions({ name: 'AuthScreen' });
defineProps<Props>();
</script>

<template>
  <AuthBackdrop>
    <AuthCard :title="title">
      <slot />
    </AuthCard>
  </AuthBackdrop>
</template>
